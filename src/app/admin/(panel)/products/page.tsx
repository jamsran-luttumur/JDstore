import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { toggleProductFlagAction } from "@/app/admin/actions";
import { AdminHeader, Flash } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatMNT } from "@/lib/format";

export const metadata = { title: "Бараа" };

type SP = Record<string, string | undefined>;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 100);
  const where: Prisma.ProductWhereInput = {
    ...(q && { name: { contains: q, mode: "insensitive" } }),
    ...(sp.category && { categoryId: sp.category }),
    ...(sp.filter === "featured" && { isFeatured: true }),
    ...(sp.filter === "inactive" && { isActive: false }),
    ...(sp.filter === "low" && { stock: { lte: 5 } }),
  };
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: { category: { select: { name: true } }, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      take: 200,
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <AdminHeader title="Бараа" action={{ href: "/admin/products/new", label: "+ Шинэ бараа" }} />
      {sp.saved && <Flash>Бараа хадгалагдлаа.</Flash>}
      {sp.deleted && <Flash>Бараа устгагдлаа.</Flash>}
      {sp.archived && <Flash tone="warn">Энэ бараа захиалгын түүхэнд байгаа тул устгахын оронд идэвхгүй болгож нууллаа.</Flash>}

      <form method="get" className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_200px_200px_auto]">
        <input name="q" defaultValue={q} placeholder="Нэрээр хайх" className="input !py-2" aria-label="Хайх" />
        <select name="category" defaultValue={sp.category ?? ""} className="input !py-2" aria-label="Ангилал">
          <option value="">Бүх ангилал</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="filter" defaultValue={sp.filter ?? ""} className="input !py-2" aria-label="Шүүлт">
          <option value="">Бүгд</option>
          <option value="featured">Онцлох</option>
          <option value="low">Үлдэгдэл бага (≤5)</option>
          <option value="inactive">Идэвхгүй</option>
        </select>
        <button className="btn-primary !py-2">Шүүх</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Бараа</th>
              <th className="px-4 py-3">Ангилал</th>
              <th className="px-4 py-3 text-right">Үнэ</th>
              <th className="px-4 py-3 text-right">Үлдэгдэл</th>
              <th className="px-4 py-3 text-center">Онцлох</th>
              <th className="px-4 py-3 text-center">Идэвхтэй</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p.id} className={p.isActive ? "" : "opacity-60"}>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:text-brand-600">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface">
                      {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="44px" className="object-cover" />}
                    </span>
                    <span className="font-medium">{p.name}</span>
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-muted">{p.category.name}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {p.salePrice ? (
                    <>
                      <span className="font-semibold text-accent-600">{formatMNT(p.salePrice)}</span>
                      <span className="ml-1 text-xs text-muted line-through">{formatMNT(p.price)}</span>
                    </>
                  ) : (
                    <span className="font-semibold">{formatMNT(p.price)}</span>
                  )}
                </td>
                <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${p.stock === 0 ? "text-rose-600" : p.stock <= 5 ? "text-amber-600" : ""}`}>{p.stock}</td>
                {(["isFeatured", "isActive"] as const).map((flag) => (
                  <td key={flag} className="px-4 py-2.5 text-center">
                    <form action={toggleProductFlagAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="flag" value={flag} />
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${p[flag] ? "bg-brand-600" : "bg-slate-300"}`}
                        aria-label={`${flag === "isFeatured" ? "Онцлох" : "Идэвхтэй"}: ${p[flag] ? "тийм" : "үгүй"}`}
                        aria-pressed={p[flag]}
                      >
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${p[flag] ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </form>
                  </td>
                ))}
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Бараа олдсонгүй</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
