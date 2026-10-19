import { discountPercent, formatMNT } from "@/lib/format";

export function Price({ price, salePrice, size = "md" }: { price: number; salePrice: number | null; size?: "md" | "lg" }) {
  const pct = discountPercent(price, salePrice);
  const current = pct > 0 ? salePrice! : price;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span data-testid="price" className={size === "lg" ? "text-3xl font-extrabold text-ink" : "text-base font-bold text-ink sm:text-lg"}>
        {formatMNT(current)}
      </span>
      {pct > 0 && (
        <>
          <span className={`${size === "lg" ? "text-lg" : "text-xs sm:text-sm"} text-muted line-through`}>{formatMNT(price)}</span>
          {size === "lg" && (
            <span className="rounded-lg bg-accent-50 px-2 py-0.5 text-sm font-bold text-accent-600">-{pct}%</span>
          )}
        </>
      )}
    </div>
  );
}
