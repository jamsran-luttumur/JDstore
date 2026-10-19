import Link from "next/link";
import { SalesTable } from "@/components/admin/SalesTable";
import { AdminHeader, StatCard, StatusBadge } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMNT, ubDateStamp } from "@/lib/format";
import { dailySales, monthlySales, topProducts } from "@/lib/reports";

export const metadata = { title: "Хяналт" };

export default async function DashboardPage() {
  const [daily, monthly, top, pending, lowStock, recent] = await Promise.all([
    dailySales(30),
    monthlySales(12),
    topProducts(5),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.findMany({ where: { isActive: true, stock: { lte: 5 } }, orderBy: { stock: "asc" }, take: 8, select: { id: true, name: true, stock: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, orderNumber: true, customerName: true, total: true, status: true, createdAt: true } }),
  ]);
  const s = ubDateStamp();
  const todayKey = `20${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  const today = daily.find((d) => d.period === todayKey);
  const thisMonth = monthly.find((m) => m.period === todayKey.slice(0, 7));

  return (
    <>
      <AdminHeader title="Хяналтын самбар" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Өнөөдрийн борлуулалт" value={formatMNT(today?.revenue ?? 0)} hint={`${today?.orders ?? 0} захиалга`} />
        <StatCard label="Энэ сарын борлуулалт" value={formatMNT(thisMonth?.revenue ?? 0)} hint={`${thisMonth?.orders ?? 0} захиалга`} />
        <StatCard label="Хүлээгдэж буй захиалга" value={String(pending)} hint="Төлбөр / баталгаажуулалт хүлээж буй" />
        <StatCard label="Үлдэгдэл бага бараа" value={String(lowStock.length)} hint="5 ба түүнээс доош" />
      </div>
      <p className="mt-2 text-xs text-muted">* Борлуулалтад “Төлөгдсөн”, “Хүргэлтэд”, “Хүргэгдсэн” төлөвтэй захиалгыг захиалсан өдрөөр (УБ цаг) тооцно.</p>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SalesTable title="Өдрийн борлуулалт (30 хоног)" rows={daily} empty="Сүүлийн 30 хоногт борлуулалт алга" />
        <SalesTable title="Сарын борлуулалт (12 сар)" rows={monthly} empty="Борлуулалт алга" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold">Сүүлийн захиалгууд</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-brand-600">Бүгд →</Link>
          </div>
          <ul className="divide-y divide-line">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-surface">
                  <span>
                    <span className="font-mono text-sm font-semibold">{o.orderNumber}</span>
                    <span className="ml-2 text-sm text-muted">{o.customerName}</span>
                  </span>
                  <span className="flex items-center gap-3 text-sm">
                    <span className="text-muted">{formatDateTime(o.createdAt)}</span>
                    <span className="font-semibold">{formatMNT(o.total)}</span>
                    <StatusBadge status={o.status} />
                  </span>
                </Link>
              </li>
            ))}
            {recent.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">Захиалга алга</li>}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-bold">Их зарагдсан (30 хоног)</h2>
            <ol className="space-y-2 text-sm">
              {top.map((t, i) => (
                <li key={t.name} className="flex justify-between gap-2">
                  <span><span className="text-muted">{i + 1}.</span> {t.name}</span>
                  <span className="shrink-0 font-semibold">{t.qty} ш</span>
                </li>
              ))}
              {top.length === 0 && <li className="text-muted">Мэдээлэл алга</li>}
            </ol>
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-bold">Үлдэгдэл бага</h2>
            <ul className="space-y-2 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <Link href={`/admin/products/${p.id}`} className="hover:text-brand-600">{p.name}</Link>
                  <span className={`shrink-0 font-semibold ${p.stock === 0 ? "text-rose-600" : "text-amber-600"}`}>{p.stock} ш</span>
                </li>
              ))}
              {lowStock.length === 0 && <li className="text-muted">Бүх бараа хангалттай</li>}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
