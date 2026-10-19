import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminHeader, StatusBadge } from "@/components/admin/ui";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMNT } from "@/lib/format";

export const metadata = { title: "Захиалгууд" };

type SP = Record<string, string | undefined>;
const PAGE = 20;
const STATUSES = Object.keys(ORDER_STATUS_LABEL) as (keyof typeof ORDER_STATUS_LABEL)[];
const METHODS = Object.keys(PAYMENT_METHOD_LABEL) as (keyof typeof PAYMENT_METHOD_LABEL)[];

/** "YYYY-MM-DD" (УБ цаг) → UTC Date */
function ubDay(s: string | undefined, endOfDay = false) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}T${endOfDay ? "23:59:59.999" : "00:00:00"}+08:00`);
  return isNaN(d.getTime()) ? undefined : d;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const method = METHODS.find((m) => m === sp.method);
  const q = sp.q?.trim().slice(0, 50);
  const from = ubDay(sp.from);
  const to = ubDay(sp.to, true);
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
    ...(method && { paymentMethod: method }),
    ...((from || to) && { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } }),
    ...(q && {
      OR: [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { phone: { contains: q.replace(/\D/g, "") || q } },
        { customerName: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [orders, total, sum, counts] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { _count: { select: { items: true } } } }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { total: true } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const href = (patch: SP) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <>
      <AdminHeader title="Захиалгууд" />

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 no-scrollbar">
        <Link href={href({ status: undefined, page: undefined })} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${!status ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line"}`}>
          Бүгд
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={href({ status: s, page: undefined })} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${status === s ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line"}`}>
            {ORDER_STATUS_LABEL[s]} <span className="opacity-60">{countBy[s] ?? 0}</span>
          </Link>
        ))}
      </div>

      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_150px_150px_auto]" method="get">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Дугаар, утас, нэрээр хайх" className="input !py-2" aria-label="Хайх" />
        <select name="method" defaultValue={method ?? ""} className="input !py-2" aria-label="Төлбөрийн хэлбэр">
          <option value="">Бүх төлбөр</option>
          {METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>)}
        </select>
        <input type="date" name="from" defaultValue={sp.from} className="input !py-2" aria-label="Эхлэх огноо" />
        <input type="date" name="to" defaultValue={sp.to} className="input !py-2" aria-label="Дуусах огноо" />
        <div className="flex gap-2">
          <button className="btn-primary !py-2">Шүүх</button>
          <Link href="/admin/orders" className="btn-ghost !py-2">Цэвэрлэх</Link>
        </div>
      </form>

      <p className="mb-3 text-sm text-muted">
        {total} захиалга · нийт дүн <b className="text-ink">{formatMNT(sum._sum.total ?? 0)}</b>
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Дугаар</th>
              <th className="px-4 py-3">Огноо</th>
              <th className="px-4 py-3">Захиалагч</th>
              <th className="px-4 py-3">Төлбөр</th>
              <th className="px-4 py-3 text-right">Дүн</th>
              <th className="px-4 py-3">Төлөв</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-brand-700 hover:underline">{o.orderNumber}</Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(o.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{o.customerName}</div>
                  <a href={`tel:${o.phone}`} className="text-muted">{o.phone}</a>
                </td>
                <td className="px-4 py-3">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMNT(o.total)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Захиалга олдсонгүй</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="mt-4 flex justify-center gap-2">
          {page > 1 && <Link href={href({ page: String(page - 1) })} className="btn-outline !py-2">Өмнөх</Link>}
          <span className="px-3 py-2 text-sm text-muted">{page} / {pages}</span>
          {page < pages && <Link href={href({ page: String(page + 1) })} className="btn-outline !py-2">Дараах</Link>}
        </nav>
      )}
    </>
  );
}
