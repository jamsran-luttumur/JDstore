import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { discountPercent, effectivePrice } from "@/lib/format";
import { Price } from "./Price";
import { AddToCartButton } from "./cart/AddToCartButton";

export function ProductCard({ p, priority = false }: { p: ProductCardData; priority?: boolean }) {
  const pct = discountPercent(p.price, p.salePrice);
  const soldOut = p.stock <= 0;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70">
      <Link href={`/products/${p.slug}`} className="relative block aspect-square overflow-hidden bg-surface">
        {p.image ? (
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="(min-width:1280px) 280px, (min-width:768px) 30vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-[1.04]"
            priority={priority}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">Зураггүй</div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {pct > 0 && <span className="rounded-lg bg-accent-500 px-2 py-0.5 text-xs font-bold text-white">-{pct}%</span>}
          {soldOut && <span className="rounded-lg bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white">Дууссан</span>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{p.categoryName}</p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-ink sm:text-[15px]">
          <Link href={`/products/${p.slug}`} className="hover:text-brand-600">
            {p.name}
          </Link>
        </h3>
        <div className="mt-auto space-y-3">
          <Price price={p.price} salePrice={p.salePrice} />
          <AddToCartButton
            product={{ productId: p.id, slug: p.slug, name: p.name, image: p.image, price: effectivePrice(p), stock: p.stock }}
          />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} p={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
