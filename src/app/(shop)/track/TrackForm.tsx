"use client";

import { useState } from "react";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatDateTime, formatMNT } from "@/lib/format";
import { IconCheck } from "@/components/icons";
import type { OrderStatus, PaymentMethod } from "@prisma/client";

type Result = {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  total: number;
  district: string;
  createdAt: string;
  paidAt: string | null;
  updatedAt: string;
  items: { productName: string; quantity: number; unitPrice: number; lineTotal: number }[];
};

const STEPS: OrderStatus[] = ["PENDING", "PAID", "SHIPPING", "DELIVERED"];
const STEP_LABEL: Record<string, string> = {
  PENDING: "Захиалга авсан",
  PAID: "Төлбөр баталгаажсан",
  SHIPPING: "Хүргэлтэд гарсан",
  DELIVERED: "Хүргэгдсэн",
};

export function TrackForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Result | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fd.get("phone"), orderNumber: fd.get("orderNumber") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Алдаа гарлаа");
      setOrder(data.order);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Бэлнээр төлөх захиалга "Төлөгдсөн" алхмыг алгасаж болно
  const reached = (s: OrderStatus) => {
    if (!order || order.status === "CANCELLED") return false;
    const cur = STEPS.indexOf(order.status);
    const idx = STEPS.indexOf(s);
    if (s === "PAID" && order.paymentMethod === "CASH_ON_DELIVERY") return order.status === "DELIVERED";
    return idx <= cur;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <form onSubmit={onSubmit} className="card h-fit space-y-4 p-5">
        <div>
          <label htmlFor="t-phone" className="label">Утасны дугаар</label>
          <input id="t-phone" name="phone" type="tel" inputMode="numeric" required maxLength={15} placeholder="99112233" className="input" autoComplete="tel" />
        </div>
        <div>
          <label htmlFor="t-num" className="label">Захиалгын дугаар</label>
          <input id="t-num" name="orderNumber" required maxLength={20} placeholder="JD-261019-4821" className="input font-mono uppercase" autoCapitalize="characters" />
        </div>
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button className="btn-primary h-12 w-full" disabled={loading}>{loading ? "Шалгаж байна..." : "Шалгах"}</button>
      </form>

      <div aria-live="polite">
        {!order && !error && (
          <div className="card grid h-full min-h-48 place-items-center p-6 text-center text-sm text-muted">
            Захиалгын дугаар нь захиалга өгсний дараах хуудсанд болон баталгаажуулах мессежид байгаа.
          </div>
        )}
        {order && (
          <div className="card space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted">Захиалга</p>
                <p className="font-mono text-xl font-bold">{order.orderNumber}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${ORDER_STATUS_COLOR[order.status]}`}>{ORDER_STATUS_LABEL[order.status]}</span>
            </div>

            {order.status === "CANCELLED" ? (
              <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">Энэ захиалга цуцлагдсан байна.</p>
            ) : (
              <ol className="grid gap-3 sm:grid-cols-4">
                {STEPS.map((s) => {
                  const ok = reached(s);
                  return (
                    <li key={s} className="flex items-center gap-3 sm:flex-col sm:text-center">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${ok ? "bg-brand-600 text-white" : "bg-surface text-slate-400"}`}>
                        <IconCheck width={18} height={18} />
                      </span>
                      <span className={`text-sm ${ok ? "font-semibold text-ink" : "text-muted"}`}>{STEP_LABEL[s]}</span>
                    </li>
                  );
                })}
              </ol>
            )}

            <ul className="divide-y divide-line text-sm">
              {order.items.map((i, k) => (
                <li key={k} className="flex justify-between gap-2 py-2">
                  <span>{i.productName} × {i.quantity}</span>
                  <span className="font-semibold">{formatMNT(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Нийт дүн</dt><dd className="text-lg font-bold">{formatMNT(order.total)}</dd></div>
              <div><dt className="text-muted">Төлбөрийн хэлбэр</dt><dd className="font-medium">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</dd></div>
              <div><dt className="text-muted">Захиалсан</dt><dd className="font-medium">{formatDateTime(order.createdAt)}</dd></div>
              <div><dt className="text-muted">Сүүлд шинэчлэгдсэн</dt><dd className="font-medium">{formatDateTime(order.updatedAt)}</dd></div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
