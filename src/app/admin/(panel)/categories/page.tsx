import { AdminHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { CategoryForm } from "./CategoryRow";

export const metadata = { title: "Ангилал" };

export default async function CategoriesPage() {
  const cats = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return (
    <>
      <AdminHeader title="Ангилал" />
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Шинэ ангилал</h2>
      <CategoryForm key={`new-${cats.length}`} cat={{ name: "", slug: "", description: "", sortOrder: cats.length + 1 }} />
      <h2 className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-muted">Одоо байгаа ({cats.length})</h2>
      <div className="space-y-3">
        {cats.map((c) => (
          <CategoryForm key={c.id} cat={{ ...c, count: c._count.products }} />
        ))}
      </div>
    </>
  );
}
