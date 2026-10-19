import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing, type RawSearchParams } from "@/components/ProductListing";
import { Breadcrumbs, PageHeader } from "@/components/Section";
import { getCategoryBySlug } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: "Ангилал олдсонгүй" };
  const sp = await searchParams;
  return {
    title: cat.name,
    description: cat.description || `${cat.name} ангиллын бараа — JDstore онлайн дэлгүүр`,
    alternates: { canonical: `/category/${cat.slug}` },
    openGraph: { title: `${cat.name} | JDstore`, url: `/category/${cat.slug}` },
    robots: Object.keys(sp).length > 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title={cat.name}>
        <Breadcrumbs items={[{ label: "Бүх бараа", href: "/products" }, { label: cat.name }]} />
      </PageHeader>
      {cat.description && <p className="container-x pt-4 text-sm text-muted">{cat.description}</p>}
      <ProductListing sp={sp} basePath={`/category/${cat.slug}`} fixedCategory={cat.slug} />
    </>
  );
}
