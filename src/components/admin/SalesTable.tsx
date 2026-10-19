import { formatMNT } from "@/lib/format";
import type { SalesRow } from "@/lib/reports";

export function SalesTable({ title, rows, empty }: { title: string; rows: SalesRow[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  const total = rows.reduce((s, r) => s + r.revenue, 0);
  const orders = rows.reduce((s, r) => s + r.orders, 0);
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
        <h2 className="font-bold">{title}</h2>
        <p className="text-sm text-muted">
          Нийт <b className="text-ink">{formatMNT(total)}</b> · {orders} захиалга
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">{empty}</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-2 font-semibold">Хугацаа</th>
                <th className="px-2 py-2 text-right font-semibold">Захиалга</th>
                <th className="px-5 py-2 text-right font-semibold">Борлуулалт</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.period}>
                  <td className="whitespace-nowrap px-5 py-2.5 font-mono text-[13px]">{r.period}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{r.orders}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      <span className="hidden h-2 flex-1 overflow-hidden rounded-full bg-surface sm:block">
                        <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(r.revenue / max) * 100}%` }} />
                      </span>
                      <span className="w-28 text-right font-semibold tabular-nums">{formatMNT(r.revenue)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
