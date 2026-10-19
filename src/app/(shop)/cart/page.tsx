import type { Metadata } from "next";
import { Breadcrumbs, PageHeader } from "@/components/Section";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Сагс", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageHeader title="Сагс">
        <Breadcrumbs items={[{ label: "Сагс" }]} />
      </PageHeader>
      <div className="container-x py-6 sm:py-8">
        <CartView />
      </div>
    </>
  );
}
