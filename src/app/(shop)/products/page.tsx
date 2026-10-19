import type { Metadata } from "next";
import { ProductListing, type RawSearchParams } from "@/components/ProductListing";
import { Breadcrumbs, PageHeader } from "@/components/Section";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const filtered = Object.keys(sp).length > 0;
  return {
    title: q ? `“${q}” хайлтын үр дүн` : "Бүх бараа",
    description: "JDstore-ийн бүх бараа: ангилал, үнээр шүүж, хямдралтай барааг олоорой.",
    alternates: { canonical: "/products" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <>
      <PageHeader title={sp.sale === "1" ? "Хямдралтай бараа" : "Бүх бараа"}>
        <Breadcrumbs items={[{ label: "Бүх бараа" }]} />
      </PageHeader>
      <ProductListing sp={sp} basePath="/products" />
    </>
  );
}
