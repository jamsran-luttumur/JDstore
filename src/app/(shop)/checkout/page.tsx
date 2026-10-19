import type { Metadata } from "next";
import { Breadcrumbs, PageHeader } from "@/components/Section";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Захиалга өгөх", robots: { index: false } };

export default function CheckoutPage() {
  // QPay гэрээ хийгдээгүй бол QPAY_ENABLED=false болгож нууж болно
  const qpayEnabled = process.env.QPAY_ENABLED !== "false";
  const methods = [...(qpayEnabled ? (["QPAY"] as const) : []), "BANK_TRANSFER", "CASH_ON_DELIVERY"] as ("QPAY" | "BANK_TRANSFER" | "CASH_ON_DELIVERY")[];
  return (
    <>
      <PageHeader title="Захиалга өгөх">
        <Breadcrumbs items={[{ label: "Сагс", href: "/cart" }, { label: "Захиалга" }]} />
      </PageHeader>
      <div className="container-x py-6 sm:py-8">
        <CheckoutForm enabledMethods={methods} />
      </div>
    </>
  );
}
