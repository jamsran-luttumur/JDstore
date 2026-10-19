import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { IconCheck, IconPhone, IconReturn, IconTruck } from "@/components/icons";
import { Price } from "@/components/Price";
import { ProductGrid } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { Breadcrumbs, Section } from "@/components/Section";
import { getProductBySlug, getRelated } from "@/lib/catalog";
import { effectivePrice, formatMNT } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Бараа олдсонгүй", robots: { index: false } };
  const description = `${p.name} — ${formatMNT(effectivePrice(p))}. ${p.description.replace(/\s+/g, " ").slice(0, 140)}`;
  const image = p.images[0]?.url;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      type: "website",
      title: `${p.name} | JDstore`,
      description,
      url: `/products/${p.slug}`,
      images: image ? [{ url: image, width: 1200, height: 1200, alt: p.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const [related, settings] = await Promise.all([getRelated(p.id, p.categoryId), getSettings()]);
  const price = effectivePrice(p);
  const inStock = p.stock > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: p.id,
    image: p.images.map((i) => (i.url.startsWith("http") ? i.url : `${SITE_URL}${i.url}`)),
    category: p.category.name,
    brand: { "@type": "Brand", name: "JDstore" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${p.slug}`,
      priceCurrency: "MNT",
      price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-x py-4 sm:py-6">
        <Breadcrumbs items={[{ label: p.category.name, href: `/category/${p.category.slug}` }, { label: p.name }]} />
      </div>

      <div className="container-x grid gap-6 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={p.images} name={p.name} />

        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-brand-600">{p.category.name}</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">{p.name}</h1>
          </div>

          <Price price={p.price} salePrice={p.salePrice} size="lg" />

          <p className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${inStock ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {inStock ? (
              <>
                <IconCheck width={16} height={16} />
                Бэлэн байгаа · Үлдэгдэл: {p.stock} ширхэг
              </>
            ) : (
              "Дууссан"
            )}
          </p>

          <div className="card p-4 sm:p-5">
            <AddToCartButton
              variant="full"
              product={{ productId: p.id, slug: p.slug, name: p.name, image: p.images[0]?.url ?? null, price, stock: p.stock }}
            />
          </div>

          <ul className="grid gap-2 text-sm text-slate-700">
            <li className="flex items-center gap-2">
              <IconTruck width={18} height={18} className="text-brand-600" />
              {settings.freeShippingThreshold > 0
                ? `${formatMNT(settings.freeShippingThreshold)}-өөс дээш захиалгад УБ-д үнэгүй хүргэлт`
                : `Хүргэлт ${formatMNT(settings.shippingFeeUB)}`}
            </li>
            <li className="flex items-center gap-2">
              <IconReturn width={18} height={18} className="text-brand-600" /> 7 хоногийн дотор буцаах боломжтой
            </li>
            <li className="flex items-center gap-2">
              <IconPhone width={18} height={18} className="text-brand-600" /> Асуух зүйл байвал:{" "}
              <a href={`tel:${settings.contactPhone}`} className="font-semibold text-brand-700 hover:underline">{settings.contactPhone}</a>
            </li>
          </ul>

          <div className="border-t border-line pt-5">
            <h2 className="mb-3 text-lg font-bold">Барааны тайлбар</h2>
            <div className="whitespace-pre-line text-[15px] leading-7 text-slate-700">{p.description}</div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <Section title="Төстэй бараа" href={`/category/${p.category.slug}`}>
          <ProductGrid products={related} />
        </Section>
      )}
    </>
  );
}
