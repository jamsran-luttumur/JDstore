"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { useQuote } from "@/components/cart/useQuote";
import { IconCart, IconMinus, IconPlus, IconTrash } from "@/components/icons";
import { formatMNT } from "@/lib/format";

export function CartView() {
  const { items, hydrated, setQty, remove } = useCart();
  const { quote, loading, error } = useQuote(items, hydrated);

  // Худалдаанаас гарсан барааг сагснаас автоматаар хасна
  useEffect(() => {
    quote?.lines.filter((l) => l.problem === "not_found").forEach((l) => remove(l.productId));
  }, [quote, remove]);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;

  if (items.length === 0) {
    return (
      <div className="card grid place-items-center gap-4 px-6 py-16 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-surface text-muted">
          <IconCart width={32} height={32} />
        </span>
        <p className="text-lg font-semibold">Таны сагс хоосон байна</p>
        <p className="text-sm text-muted">Дэлгүүрээс таалагдсан бараагаа сонгоорой.</p>
        <Link href="/products" className="btn-primary">Бараа үзэх</Link>
      </div>
    );
  }

  const lineFor = (id: string) => quote?.lines.find((l) => l.productId === id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
      <ul className="space-y-3">
        {items.map((it) => {
          const line = lineFor(it.productId);
          const unit = line?.unitPrice ?? it.price;
          const max = Math.min(line?.stock ?? it.stock, 50);
          return (
            <li key={it.productId} className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link href={`/products/${it.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface sm:h-28 sm:w-28">
                {it.image && <Image src={it.image} alt={it.name} fill sizes="112px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/products/${it.slug}`} className="line-clamp-2 font-semibold leading-snug hover:text-brand-600">
                    {line?.name ?? it.name}
                  </Link>
                  <button type="button" onClick={() => remove(it.productId)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-600" aria-label={`${it.name} хасах`}>
                    <IconTrash width={18} height={18} />
                  </button>
                </div>
                <p className="text-sm text-muted">
                  {formatMNT(unit)}
                  {line && line.originalPrice > line.unitPrice && <span className="ml-2 line-through">{formatMNT(line.originalPrice)}</span>}
                </p>
                {line?.problem === "out_of_stock" && <p className="text-sm font-semibold text-rose-600">Дууссан — сагснаас хасна уу</p>}
                {line?.problem === "insufficient_stock" && (
                  <p className="text-sm font-semibold text-rose-600">Үлдэгдэл {line.stock} ширхэг байна</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-xl border border-line">
                    <button type="button" className="grid h-9 w-9 place-items-center disabled:opacity-40" onClick={() => setQty(it.productId, it.quantity - 1)} disabled={it.quantity <= 1} aria-label="Хасах">
                      <IconMinus width={16} height={16} />
                    </button>
                    <span className="w-10 text-center font-semibold" aria-live="polite">{it.quantity}</span>
                    <button type="button" className="grid h-9 w-9 place-items-center disabled:opacity-40" onClick={() => setQty(it.productId, it.quantity + 1)} disabled={it.quantity >= max} aria-label="Нэмэх">
                      <IconPlus width={16} height={16} />
                    </button>
                  </div>
                  <p className="font-bold">{formatMNT(unit * it.quantity)}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div>
        <OrderSummary quote={quote} shippingNote="Орон нутгийн хүргэлтийн үнэ захиалга хийх үед тооцогдоно.">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {quote && !quote.ok && <p className="text-sm text-rose-600">Үлдэгдэлгүй барааг хасах эсвэл тоог багасгана уу.</p>}
          <Link
            href="/checkout"
            aria-disabled={!quote?.ok || loading}
            className={`btn-accent h-12 w-full text-base ${!quote?.ok || loading ? "pointer-events-none opacity-50" : ""}`}
          >
            Захиалах
          </Link>
          <Link href="/products" className="btn-ghost w-full">Худалдан авалтаа үргэлжлүүлэх</Link>
        </OrderSummary>
      </div>
    </div>
  );
}
