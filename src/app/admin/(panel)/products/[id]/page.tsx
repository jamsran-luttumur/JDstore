import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProductAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ProductForm } from "@/components/admin/ProductForm";
import { AdminHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export const metadata = { title: "Бараа засах" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!p) notFound();
  return (
    <>
      <div className="mb-2"><Link href="/admin/products" className="text-sm text-muted hover:text-ink">← Бараа</Link></div>
      <AdminHeader title={p.name}>
        <Link href={`/products/${p.slug}`} target="_blank" className="btn-ghost">Дэлгүүрт харах ↗</Link>
        <form action={deleteProductAction}>
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton message="Энэ барааг устгах уу? (Захиалгад орсон бол нуугдана)" className="btn-danger">Бараа устгах</ConfirmButton>
        </form>
      </AdminHeader>
      <ProductForm
        categories={categories}
        product={{
          id: p.id, name: p.name, slug: p.slug, description: p.description, price: p.price, salePrice: p.salePrice, stock: p.stock,
          categoryId: p.categoryId, isFeatured: p.isFeatured, isActive: p.isActive, images: p.images.map((i) => i.url),
        }}
      />
    </>
  );
}
