import "server-only";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { SortValue } from "./constants";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  stock: number;
  image: string | null;
  categoryName: string;
};

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  price: true,
  salePrice: true,
  stock: true,
  category: { select: { name: true } },
  images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(p: CardRow): ProductCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    salePrice: p.salePrice,
    stock: p.stock,
    image: p.images[0]?.url ?? null,
    categoryName: p.category.name,
  };
}

export const getCategories = cache(async () =>
  prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, description: true, _count: { select: { products: { where: { isActive: true } } } } },
  }),
);

export async function getHomeData() {
  const [banners, featured, bestsellers, onSale, categories] = await Promise.all([
    prisma.banner.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.product.findMany({ where: { isActive: true, isFeatured: true }, select: cardSelect, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.product.findMany({ where: { isActive: true, soldCount: { gt: 0 } }, select: cardSelect, orderBy: { soldCount: "desc" }, take: 8 }),
    prisma.product.findMany({ where: { isActive: true, salePrice: { not: null } }, select: cardSelect, orderBy: { updatedAt: "desc" }, take: 8 }),
    getCategories(),
  ]);

  const perCategory = await Promise.all(
    categories
      .filter((c) => c._count.products > 0)
      .map(async (c) => ({
        category: c,
        products: (
          await prisma.product.findMany({
            where: { isActive: true, categoryId: c.id },
            select: cardSelect,
            orderBy: [{ isFeatured: "desc" }, { soldCount: "desc" }],
            take: 4,
          })
        ).map(toCard),
      })),
  );

  return {
    banners,
    featured: featured.map(toCard),
    bestsellers: bestsellers.map(toCard),
    onSale: onSale.filter((p) => p.salePrice !== null && p.salePrice < p.price).map(toCard),
    perCategory,
    categories,
  };
}

export type ListFilters = {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  sale?: boolean;
  inStock?: boolean;
  sort?: SortValue;
  page?: number;
};

export const PAGE_SIZE = 12;

export async function listProducts(f: ListFilters) {
  const page = Math.max(1, f.page ?? 1);
  const and: Prisma.ProductWhereInput[] = [{ isActive: true }];
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.q) {
    const terms = f.q.trim().split(/\s+/).filter(Boolean).slice(0, 6);
    for (const t of terms) {
      and.push({ OR: [{ name: { contains: t, mode: "insensitive" } }, { description: { contains: t, mode: "insensitive" } }] });
    }
  }
  if (f.sale) and.push({ salePrice: { not: null } });
  if (f.inStock) and.push({ stock: { gt: 0 } });

  // Үнийн шүүлт нь бодит (хямдарсан бол хямдралын) үнээр
  if (f.min !== undefined || f.max !== undefined) {
    const range = { ...(f.min !== undefined && { gte: f.min }), ...(f.max !== undefined && { lte: f.max }) };
    and.push({ OR: [{ salePrice: null, price: range }, { salePrice: range }] });
  }
  const where: Prisma.ProductWhereInput = { AND: and };

  // Бодит (хямдарсан) үнээр эрэмбэлэхийн тулд тохирох барааны ID-г авч санах ойд эрэмбэлнэ (жижиг/дунд каталогид хангалттай)
  if (f.sort === "price_asc" || f.sort === "price_desc" || f.sort === "discount") {
    const all = await prisma.product.findMany({ where, select: { id: true, price: true, salePrice: true, createdAt: true } });
    const eff = (p: { price: number; salePrice: number | null }) => (p.salePrice !== null && p.salePrice < p.price ? p.salePrice : p.price);
    const disc = (p: { price: number; salePrice: number | null }) => (p.salePrice !== null && p.salePrice < p.price ? (p.price - p.salePrice) / p.price : 0);
    all.sort((a, b) =>
      f.sort === "price_asc" ? eff(a) - eff(b) : f.sort === "price_desc" ? eff(b) - eff(a) : disc(b) - disc(a) || b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const total = all.length;
    const ids = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => p.id);
    const rows = await prisma.product.findMany({ where: { id: { in: ids } }, select: cardSelect });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return { items: ids.map((id) => toCard(byId.get(id)!)), total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    f.sort === "popular" ? [{ soldCount: "desc" }, { createdAt: "desc" }] : [{ createdAt: "desc" }, { id: "asc" }];
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, select: cardSelect, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  return { items: rows.map(toCard), total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export const getProductBySlug = cache(async (slug: string) =>
  prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
  }),
);

export async function getRelated(productId: string, categoryId: string) {
  const rows = await prisma.product.findMany({
    where: { isActive: true, categoryId, id: { not: productId } },
    select: cardSelect,
    orderBy: { soldCount: "desc" },
    take: 4,
  });
  return rows.map(toCard);
}

export const getCategoryBySlug = cache(async (slug: string) => prisma.category.findUnique({ where: { slug } }));
