import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { IconBank, IconCash, IconCheck, IconPhone, IconQr } from "@/components/icons";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMNT } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { verifyOrderAccessToken } from "@/lib/tokens";
import { QPayPayment } from "./QPayPayment";

export const metadata: Metadata = { title: "Захиалга", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params;
  const { t } = await searchParams;
  const orderNumber = decodeURIComponent(number).toUpperCase();

  const valid = /^JD-\d{6}-\d{4,6}$/.test(orderNumber) && verifyOrderAccessToken(orderNumber, t);
  const order = valid ? await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } }) : null;

  if (!order) {
    return (
      <div className="container-x grid place-items-center py-20 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold">Захиалга олдсонгүй</h1>
          <p className="text-muted">Холбоос буруу эсвэл хугацаа нь дууссан байна. Захиалгаа утас болон захиалгын дугаараар шалгана уу.</p>
          <Link href="/track" className="btn-primary">Захиалга шалгах</Link>
        </div>
      </div>
    );
  }

  const s = await getSettings();
  const isPending = order.status === "PENDING";

  return (
    <div className="container-x max-w-4xl py-8 sm:py-12">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15">
            <IconCheck width={28} height={28} />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Захиалга амжилттай бүртгэгдлээ!</h1>
          <p className="mt-2 text-white/80">Баярлалаа, {order.customerName}. Бид удахгүй тантай холбогдоно.</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-white/10 p-3">
            <span className="text-sm text-white/70">Захиалгын дугаар:</span>
            <span className="font-mono text-xl font-bold tracking-wider" data-testid="order-number">{order.orderNumber}</span>
            <CopyButton value={order.orderNumber} />
          </div>
          <p className="mt-3 text-xs text-white/70">Энэ дугаарыг хадгална уу — “Захиалга шалгах” хуудсанд утасны дугаартайгаа хамт ашиглана.</p>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_300px]">
          <section aria-labelledby="pay-h" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="pay-h" className="text-lg font-bold">Төлбөр</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${ORDER_STATUS_COLOR[order.status]}`} data-testid="order-status">
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </div>

            {order.paymentMethod === "QPAY" && isPending && (
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm font-semibold"><IconQr width={18} height={18} /> QPay-ээр {formatMNT(order.total)} төлнө үү</p>
                <QPayPayment orderNumber={order.orderNumber} token={t!} />
              </div>
            )}

            {order.paymentMethod === "BANK_TRANSFER" && isPending && (
              <div className="space-y-3 rounded-2xl border border-line p-4 sm:p-5">
                <p className="flex items-center gap-2 font-semibold"><IconBank width={18} height={18} /> Дансаар шилжүүлэх заавар</p>
                <dl className="divide-y divide-line text-[15px]">
                  {[
                    ["Банк", s.bankName],
                    ["Дансны дугаар", s.bankAccount],
                    ...(s.bankIban ? [["IBAN", s.bankIban]] : []),
                    ["Хүлээн авагч", s.bankHolder],
                    ["Шилжүүлэх дүн", formatMNT(order.total)],
                    ["Гүйлгээний утга", order.orderNumber],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <dt className="text-muted">{k}</dt>
                      <dd className="flex items-center gap-2 font-semibold">
                        <span className={k === "Гүйлгээний утга" ? "font-mono text-brand-700" : ""}>{v}</span>
                        {k !== "Банк" && k !== "Хүлээн авагч" && <CopyButton value={k === "Шилжүүлэх дүн" ? String(order.total) : v} />}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  ⚠ Гүйлгээний утгад зөвхөн <b className="font-mono">{order.orderNumber}</b> гэж бичнэ үү. Төлбөр шалгагдсаны дараа захиалгын төлөв “Төлөгдсөн” болно.
                </p>
              </div>
            )}

            {order.paymentMethod === "CASH_ON_DELIVERY" && order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
              <div className="flex gap-3 rounded-2xl border border-line p-4 sm:p-5">
                <IconCash width={22} height={22} className="shrink-0 text-brand-600" />
                <p className="text-[15px]">Бараагаа хүлээн авахдаа <b>{formatMNT(order.total)}</b>-г хүргэлтийн ажилтанд бэлнээр эсвэл дансаар төлнө үү.</p>
              </div>
            )}

            {order.status === "PAID" && (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-800">
                <IconCheck width={20} height={20} /> Төлбөр баталгаажлаа. Таны захиалгыг бэлтгэж байна.
              </p>
            )}

            <p className="flex items-center gap-2 text-sm text-muted">
              <IconPhone width={16} height={16} /> Асуух зүйл байвал:{" "}
              <a href={`tel:${s.contactPhone}`} className="font-semibold text-brand-700">{s.contactPhone}</a>
            </p>
          </section>

          <aside className="space-y-4 rounded-2xl bg-surface p-5 text-sm">
            <h2 className="text-base font-bold">Захиалгын мэдээлэл</h2>
            <ul className="space-y-2">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span>{i.productName} × {i.quantity}</span>
                  <span className="shrink-0 font-semibold">{formatMNT(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line pt-3">
              <div className="flex justify-between"><dt className="text-muted">Барааны дүн</dt><dd>{formatMNT(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Хүргэлт</dt><dd>{order.shippingFee ? formatMNT(order.shippingFee) : "Үнэгүй"}</dd></div>
              <div className="flex justify-between text-base font-bold"><dt>Нийт</dt><dd data-testid="order-total">{formatMNT(order.total)}</dd></div>
            </dl>
            <dl className="space-y-1.5 border-t border-line pt-3">
              <div><dt className="text-muted">Төлбөрийн хэлбэр</dt><dd className="font-medium">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</dd></div>
              <div><dt className="text-muted">Хүргэх хаяг</dt><dd className="font-medium">{order.district}, {order.khoroo}, {order.address}</dd></div>
              <div><dt className="text-muted">Огноо</dt><dd className="font-medium">{formatDateTime(order.createdAt)}</dd></div>
            </dl>
          </aside>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/products" className="btn-outline">Дэлгүүр үргэлжлүүлэх</Link>
        <Link href="/track" className="btn-ghost">Захиалга шалгах</Link>
      </div>
    </div>
  );
}
