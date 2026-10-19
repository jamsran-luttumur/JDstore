"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { useQuote } from "@/components/cart/useQuote";
import { IconBank, IconCash, IconQr } from "@/components/icons";
import { DISTRICTS } from "@/lib/constants";
import { formatMNT } from "@/lib/format";

type Method = "QPAY" | "BANK_TRANSFER" | "CASH_ON_DELIVERY";

const methods: { value: Method; title: string; desc: string; icon: typeof IconQr }[] = [
  { value: "QPAY", title: "QPay", desc: "Бүх банкны аппаар QR уншуулж төлнө", icon: IconQr },
  { value: "BANK_TRANSFER", title: "Дансаар шилжүүлэх", desc: "Гүйлгээний утгад захиалгын дугаараа бичнэ", icon: IconBank },
  { value: "CASH_ON_DELIVERY", title: "Хүргэлтээр бэлнээр", desc: "Бараагаа хүлээн авахдаа төлнө", icon: IconCash },
];

export function CheckoutForm({ enabledMethods }: { enabledMethods: Method[] }) {
  const router = useRouter();
  const { items, hydrated, clear } = useCart();
  const [district, setDistrict] = useState("");
  const [method, setMethod] = useState<Method>(enabledMethods[0] ?? "QPAY");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { quote, loading } = useQuote(items, hydrated, district || undefined);

  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-surface" />;
  if (items.length === 0 && !submitting) {
    return (
      <div className="card grid place-items-center gap-4 px-6 py-16 text-center">
        <p className="text-lg font-semibold">Сагс хоосон байна</p>
        <Link href="/products" className="btn-primary">Бараа үзэх</Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      customerName: String(fd.get("customerName") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      district: String(fd.get("district") ?? ""),
      khoroo: String(fd.get("khoroo") ?? ""),
      address: String(fd.get("address") ?? ""),
      note: String(fd.get("note") ?? ""),
      paymentMethod: method,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setFormError(data.error || "Алдаа гарлаа. Дахин оролдоно уу.");
        setSubmitting(false);
        const first = document.querySelector<HTMLElement>("[aria-invalid=true]");
        first?.focus();
        return;
      }
      router.replace(`/order/${encodeURIComponent(data.orderNumber)}?t=${encodeURIComponent(data.token)}`);
      clear();
    } catch {
      setFormError("Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгаад дахин оролдоно уу.");
      setSubmitting(false);
    }
  }

  const err = (k: string) =>
    errors[k] ? (
      <p id={`${k}-err`} className="mt-1 text-sm text-rose-600">
        {errors[k]}
      </p>
    ) : null;
  const a11y = (k: string) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-err` : undefined });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
      <div className="space-y-6">
        <fieldset className="card space-y-4 p-5">
          <legend className="sr-only">Хүлээн авагч</legend>
          <h2 className="text-lg font-bold">1. Хүлээн авагчийн мэдээлэл</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="customerName" className="label">Нэр *</label>
              <input id="customerName" name="customerName" className="input" autoComplete="name" required maxLength={100} placeholder="Таны нэр" {...a11y("customerName")} />
              {err("customerName")}
            </div>
            <div>
              <label htmlFor="phone" className="label">Утасны дугаар *</label>
              <input id="phone" name="phone" type="tel" inputMode="numeric" className="input" autoComplete="tel" required maxLength={15} placeholder="99112233" {...a11y("phone")} />
              {err("phone")}
            </div>
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="sr-only">Хүргэлтийн хаяг</legend>
          <h2 className="text-lg font-bold">2. Хүргэлтийн хаяг</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="district" className="label">Дүүрэг *</label>
              <select id="district" name="district" className="input" required value={district} onChange={(e) => setDistrict(e.target.value)} {...a11y("district")}>
                <option value="" disabled>Сонгох</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {err("district")}
            </div>
            <div>
              <label htmlFor="khoroo" className="label">{district === "Орон нутаг" ? "Аймаг, сум *" : "Хороо *"}</label>
              <input id="khoroo" name="khoroo" className="input" required maxLength={60} placeholder={district === "Орон нутаг" ? "Дархан-Уул, Дархан" : "Жишээ: 3"} {...a11y("khoroo")} />
              {err("khoroo")}
            </div>
          </div>
          <div>
            <label htmlFor="address" className="label">Дэлгэрэнгүй хаяг *</label>
            <textarea id="address" name="address" className="input min-h-24" required maxLength={500} placeholder="Хотхон, байр, орц, давхар, тоот, орцны код" autoComplete="street-address" {...a11y("address")} />
            {err("address")}
          </div>
          <div>
            <label htmlFor="note" className="label">Нэмэлт тайлбар</label>
            <textarea id="note" name="note" className="input min-h-20" maxLength={500} placeholder="Хүргэлтийн цаг, хэмжээ, өнгө г.м." {...a11y("note")} />
            {err("note")}
          </div>
        </fieldset>

        <fieldset className="card space-y-3 p-5">
          <legend className="sr-only">Төлбөрийн хэлбэр</legend>
          <h2 className="text-lg font-bold">3. Төлбөрийн хэлбэр</h2>
          <div className="grid gap-3">
            {methods
              .filter((m) => enabledMethods.includes(m.value))
              .map(({ value, title, desc, icon: Icon }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${method === value ? "border-brand-600 bg-brand-50" : "border-line hover:border-brand-200"}`}
                >
                  <input type="radio" name="paymentMethod" value={value} checked={method === value} onChange={() => setMethod(value)} className="h-5 w-5 accent-brand-600" />
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm">
                    <Icon width={22} height={22} />
                  </span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="block text-sm text-muted">{desc}</span>
                  </span>
                </label>
              ))}
          </div>
          {err("paymentMethod")}
        </fieldset>
      </div>

      <div>
        <OrderSummary quote={quote} shippingNote={district ? undefined : "Дүүргээ сонгоход хүргэлтийн үнэ тооцогдоно."}>
          <ul className="max-h-64 space-y-3 overflow-y-auto border-t border-line pt-4">
            {(quote?.lines ?? []).map((l) => (
              <li key={l.productId} className="flex items-center gap-3 text-sm">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                  {l.image && <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-medium">{l.name}</span>
                  <span className="text-muted">{l.quantity} × {formatMNT(l.unitPrice)}</span>
                  {!l.available && <span className="block font-semibold text-rose-600">Үлдэгдэл хүрэлцэхгүй</span>}
                </span>
                <span className="font-semibold">{formatMNT(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          {formError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{formError}</p>}
          <button type="submit" disabled={submitting || loading || !quote?.ok} className="btn-accent h-12 w-full text-base">
            {submitting ? "Илгээж байна..." : "Захиалга баталгаажуулах"}
          </button>
          {quote && !quote.ok && (
            <p className="text-sm text-rose-600">
              Сагсанд үлдэгдэлгүй бараа байна. <Link href="/cart" className="font-semibold underline">Сагс засах</Link>
            </p>
          )}
          <p className="text-xs text-muted">
            Захиалга өгснөөр та <Link href="/shipping-returns" className="underline">хүргэлт, буцаалтын нөхцөл</Link> болон{" "}
            <Link href="/privacy" className="underline">нууцлалын бодлогыг</Link> зөвшөөрч байна.
          </p>
        </OrderSummary>
      </div>
    </form>
  );
}
