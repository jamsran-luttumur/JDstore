import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { RURAL_DISTRICT } from "./constants";
import { effectivePrice } from "./format";
import type { StoreSettings } from "./settings";

export type CartInputItem = { productId: string; quantity: number };

export type QuoteLine = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  available: boolean;
  problem?: "not_found" | "out_of_stock" | "insufficient_stock";
};

export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingThreshold: number;
  ok: boolean;
};

/** Ижил барааг нэгтгэж, тоог эерэг бүхэл болгоно */
export function normalizeItems(items: CartInputItem[]): CartInputItem[] {
  const map = new Map<string, number>();
  for (const it of items) {
    const q = Math.floor(it.quantity);
    if (!it.productId || !Number.isFinite(q) || q <= 0) continue;
    map.set(it.productId, (map.get(it.productId) ?? 0) + q);
  }
  return [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export function computeShipping(subtotal: number, district: string | undefined, s: StoreSettings): number {
  if (subtotal <= 0) return 0;
  const isRural = district === RURAL_DISTRICT;
  if (!isRural && s.freeShippingThreshold > 0 && subtotal >= s.freeShippingThreshold) return 0;
  return isRural ? s.shippingFeeRural : s.shippingFeeUB;
}

/**
 * Үнийг ЗӨВХӨН өгөгдлийн сангаас тооцно. Клиентээс ирсэн үнийг хэзээ ч ашиглахгүй.
 * tx дамжуулбал transaction дотор ажиллана.
 */
export async function buildQuote(
  rawItems: CartInputItem[],
  district: string | undefined,
  settings: StoreSettings,
  tx: Prisma.TransactionClient = prisma,
): Promise<Quote> {
  const items = normalizeItems(rawItems);
  const products = await tx.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: QuoteLine[] = [];
  for (const it of items) {
    const p = byId.get(it.productId);
    if (!p) {
      lines.push({
        productId: it.productId, slug: "", name: "Олдсонгүй", image: null, unitPrice: 0, originalPrice: 0,
        quantity: it.quantity, lineTotal: 0, stock: 0, available: false, problem: "not_found",
      });
      continue;
    }
    const unitPrice = effectivePrice(p);
    const problem = p.stock <= 0 ? "out_of_stock" : p.stock < it.quantity ? "insufficient_stock" : undefined;
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.images[0]?.url ?? null,
      unitPrice,
      originalPrice: p.price,
      quantity: it.quantity,
      lineTotal: unitPrice * it.quantity,
      stock: p.stock,
      available: !problem,
      problem,
    });
  }

  const subtotal = lines.filter((l) => l.available).reduce((s, l) => s + l.lineTotal, 0);
  const shippingFee = computeShipping(subtotal, district, settings);
  return {
    lines,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    freeShippingThreshold: settings.freeShippingThreshold,
    ok: lines.length > 0 && lines.every((l) => l.available),
  };
}
