import Link from "next/link";
import { HeroSlider } from "@/components/HeroSlider";
import { ProductGrid } from "@/components/ProductCard";
import { Section } from "@/components/Section";
import { IconQr, IconReturn, IconShield, IconTruck } from "@/components/icons";
import { getHomeData } from "@/lib/catalog";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

export const revalidate = 120;

const perks = [
  { icon: IconTruck, title: "Хурдан хүргэлт", text: "УБ хотод 24–48 цагт" },
  { icon: IconShield, title: "Баталгаатай бараа", text: "Чанарын баталгаатай" },
  { icon: IconQr, title: "Аюулгүй төлбөр", text: "QPay, данс, бэлэн" },
  { icon: IconReturn, title: "Буцаалт", text: "7 хоногийн дотор" },
];

export default async function HomePage() {
  const { banners, featured, bestsellers, onSale, perCategory, categories } = await getHomeData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "JDstore",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/products?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <h1 className="sr-only">JDstore онлайн дэлгүүр</h1>

      <div className="container-x pt-4 sm:pt-6">
        <HeroSlider banners={banners} />
      </div>

      <div className="container-x mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 lg:grid-cols-4">
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 rounded-2xl bg-surface p-3 sm:p-4">
            <span className="hidden h-10 w-10 shrink-0 min-[400px]:grid place-items-center rounded-xl bg-white text-brand-600 shadow-sm">
              <Icon width={22} height={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-tight text-ink sm:text-sm">{title}</p>
              <p className="mt-0.5 text-xs leading-tight text-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="container-x pt-8" aria-label="Ангилал">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-brand-300 hover:bg-brand-50"
            >
              {c.name} <span className="text-muted">({c._count.products})</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <Section id="featured" title="Онцлох бараа" subtitle="Манай багийн сонголт" href="/products">
          <ProductGrid products={featured} priorityCount={2} />
        </Section>
      )}

      {onSale.length > 0 && (
        <div className="bg-gradient-to-b from-accent-50 to-white">
          <Section id="sale" title="Хямдралтай бараа" subtitle="Хязгаартай хугацааны үнэ" href="/products?sale=1&sort=discount">
            <ProductGrid products={onSale} />
          </Section>
        </div>
      )}

      {bestsellers.length > 0 && (
        <Section id="best" title="Бестселлер" subtitle="Хамгийн их захиалагдсан" href="/products?sort=popular">
          <ProductGrid products={bestsellers} />
        </Section>
      )}

      {perCategory.map(({ category, products }) => (
        <Section key={category.id} id={`cat-${category.slug}`} title={category.name} subtitle={category.description ?? undefined} href={`/category/${category.slug}`}>
          <ProductGrid products={products} />
        </Section>
      ))}
    </>
  );
}
