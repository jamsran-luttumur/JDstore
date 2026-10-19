import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, Flash, StatusBadge } from "@/components/admin/ui";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMNT } from "@/lib/format";
import { StatusForm } from "./StatusForm";

export const metadata = { title: "Захиалга" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { slug: true } } } }, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();
  const paidButNotPending = order.payments.some((p) => p.status === "PAID") && order.status === "CANCELLED";

  return (
    <>
      <div className="mb-2"><Link href="/admin/orders" className="text-sm text-muted hover:text-ink">← Захиалгууд</Link></div>
      <AdminHeader title={order.orderNumber}>
        <StatusBadge status={order.status} />
      </AdminHeader>
      {paidButNotPending && <Flash tone="error">Цуцлагдсан захиалгад QPay төлбөр орсон байна — буцаан олголт хийнэ үү.</Flash>}
      {order.paymentMethod === "BANK_TRANSFER" && order.status === "PENDING" && (
        <Flash tone="warn">Дансны хуулгаас “{order.orderNumber}” гүйлгээний утгатай {formatMNT(order.total)} орсныг шалгаад “Төлөгдсөн” болгоно уу.</Flash>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-4 py-3">Бараа</th><th className="px-4 py-3 text-right">Нэгж үнэ</th><th className="px-4 py-3 text-right">Тоо</th><th className="px-4 py-3 text-right">Дүн</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3"><Link href={`/products/${i.product.slug}`} target="_blank" className="hover:text-brand-600">{i.productName}</Link></td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMNT(i.unitPrice)}</td>
                    <td className="px-4 py-3 text-right">{i.quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMNT(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-sm">
                <tr><td colSpan={3} className="px-4 pt-3 text-right text-muted">Барааны дүн</td><td className="px-4 pt-3 text-right tabular-nums">{formatMNT(order.subtotal)}</td></tr>
                <tr><td colSpan={3} className="px-4 py-1 text-right text-muted">Хүргэлт</td><td className="px-4 py-1 text-right tabular-nums">{formatMNT(order.shippingFee)}</td></tr>
                <tr><td colSpan={3} className="px-4 pb-4 text-right font-bold">Нийт</td><td className="px-4 pb-4 text-right text-lg font-extrabold tabular-nums">{formatMNT(order.total)}</td></tr>
              </tfoot>
            </table>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-bold">Төлбөрийн бүртгэл (QPay)</h2>
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted">QPay нэхэмжлэх үүсээгүй.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-surface px-3 py-2">
                    <span className="font-mono text-xs">{p.invoiceId}</span>
                    <span>{formatMNT(p.amount)}{p.paidAmount ? ` (төлсөн: ${formatMNT(p.paidAmount)})` : ""}</span>
                    <span className={p.status === "PAID" ? "font-bold text-emerald-700" : "text-muted"}>{p.status}</span>
                    {p.qpayPaymentId && <span className="w-full text-xs text-muted">Гүйлгээ: {p.qpayPaymentId} · {p.paidAt && formatDateTime(p.paidAt)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5"><StatusForm id={order.id} status={order.status} /></section>
          <section className="card space-y-3 p-5 text-sm">
            <h2 className="font-bold">Захиалагч</h2>
            <dl className="space-y-2">
              <div><dt className="text-muted">Нэр</dt><dd className="font-medium">{order.customerName}</dd></div>
              <div><dt className="text-muted">Утас</dt><dd><a href={`tel:${order.phone}`} className="font-semibold text-brand-700">{order.phone}</a></dd></div>
              <div><dt className="text-muted">Хаяг</dt><dd className="font-medium">{order.district}, {order.khoroo}<br />{order.address}</dd></div>
              {order.note && <div><dt className="text-muted">Тайлбар</dt><dd className="whitespace-pre-line rounded-lg bg-amber-50 p-2">{order.note}</dd></div>}
              <div><dt className="text-muted">Төлбөрийн хэлбэр</dt><dd className="font-medium">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</dd></div>
              <div><dt className="text-muted">Үүссэн</dt><dd>{formatDateTime(order.createdAt)}</dd></div>
              {order.paidAt && <div><dt className="text-muted">Төлөгдсөн</dt><dd>{formatDateTime(order.paidAt)}</dd></div>}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
