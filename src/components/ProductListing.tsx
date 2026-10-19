import Link from "next/link";
import { Suspense } from "react";
import { getCategories, listProducts, type ListFilters } from "@/lib/catalog";
import { SORT_OPTIONS, type SortValue } from "@/lib/constants";
import { ProductGrid } from "./ProductCard";
import { ProductFilters, SortSelect } from "./ProductFilters";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => {
  if (!v) return undefined;
  const n = Number(v.replace(/\D/g, ""));
  return Number.isFinite(n) && v.trim() !== "" ? Math.min(n, 1_000_000_000) : undefined;
};

export function parseFilters(sp: RawSearchParams, fixedCategory?: string): ListFilters {
  const sort = one(sp.sort) as SortValue | undefined;
  return {
    q: one(sp.q)?.slice(0, 100) || undefined,
    category: fixedCategory ?? (one(sp.category)?.slice(0, 100) || undefined),
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    sale: one(sp.sale) === "1",
    inStock: one(sp.stock) === "1",
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : "new",
    page: Math.max(1, Math.min(1000, Number(one(sp.page)) || 1)),
  };
}

function pageHref(basePath: string, sp: RawSearchParams, page: number) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (val && k !== "page") params.set(k, val);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export async function ProductListing({ sp, basePath, fixedCategory }: { sp: RawSearchParams; basePath: string; fixedCategory?: string }) {
  const filters = parseFilters(sp, fixedCategory);
  const [{ items, total, page, pages }, categories] = await Promise.all([listProducts(filters), getCategories()]);

  return (
    <div className="container-x grid gap-6 py-6 lg:grid-cols-[230px_1fr] lg:gap-10 lg:py-8">
      <Suspense>
        <ProductFilters categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} fixedCategory={fixedCategory} />
      </Suspense>
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {filters.q && (
              <>
                “<span className="font-semibold text-ink">{filters.q}</span>” хайлтаар{" "}
              </>
            )}
            <span className="font-semibold text-ink">{total}</span> бараа олдлоо
          </p>
          <Suspense>
            <SortSelect />
          </Suspense>
        </div>

        {items.length === 0 ? (
          <div className="card grid place-items-center gap-3 px-6 py-16 text-center">
            <p className="text-lg font-semibold">Тохирох бараа олдсонгүй</p>
            <p className="text-sm text-muted">Хайлтын үгээ өөрчлөх эсвэл шүүлтүүрээ цэвэрлэж үзнэ үү.</p>
            <Link href="/products" className="btn-primary mt-2">Бүх бараа үзэх</Link>
          </div>
        ) : (
          <ProductGrid products={items} priorityCount={4} />
        )}

        {pages > 1 && (
          <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Хуудаслалт">
            {page > 1 && <Link className="btn-outline !px-3" href={pageHref(basePath, sp, page - 1)}>Өмнөх</Link>}
            {Array.from({ length: pages }, (_, k) => k + 1)
              .filter((k) => k === 1 || k === pages || Math.abs(k - page) <= 2)
              .map((k) => (
                <Link
                  key={k}
                  href={pageHref(basePath, sp, k)}
                  aria-current={k === page ? "page" : undefined}
                  className={k === page ? "btn-primary !px-4" : "btn-outline !px-4"}
                >
                  {k}
                </Link>
              ))}
            {page < pages && <Link className="btn-outline !px-3" href={pageHref(basePath, sp, page + 1)}>Дараах</Link>}
          </nav>
        )}
      </div>
    </div>
  );
}
