import { formatMNT } from "@/lib/format";
import type { Quote } from "./useQuote";

export function OrderSummary({ quote, children, shippingNote }: { quote: Quote | null; children?: React.ReactNode; shippingNote?: string }) {
  const remaining = quote && quote.freeShippingThreshold > 0 ? quote.freeShippingThreshold - quote.subtotal : 0;
  return (
    <div className="card space-y-4 p-5 lg:sticky lg:top-40">
      <h2 className="text-lg font-bold">Захиалгын дүн</h2>
      <dl className="space-y-2.5 text-[15px]">
        <div className="flex justify-between">
          <dt className="text-muted">Барааны дүн</dt>
          <dd className="font-semibold">{quote ? formatMNT(quote.subtotal) : "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Хүргэлт</dt>
          <dd className="font-semibold">{quote ? (quote.shippingFee === 0 ? <span className="text-emerald-600">Үнэгүй</span> : formatMNT(quote.shippingFee)) : "—"}</dd>
        </div>
        {shippingNote && <p className="text-xs text-muted">{shippingNote}</p>}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-bold">Нийт төлөх</dt>
          <dd className="text-2xl font-extrabold text-ink">{quote ? formatMNT(quote.total) : "—"}</dd>
        </div>
      </dl>
      {quote && remaining > 0 && quote.shippingFee > 0 && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
          Дахиад <b>{formatMNT(remaining)}</b>-ийн бараа авбал УБ-д хүргэлт үнэгүй.
        </p>
      )}
      {children}
    </div>
  );
}
