import { ProductForm } from "@/components/admin/ProductForm";
import { AdminHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export const metadata = { title: "Шинэ бараа" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <AdminHeader title="Шинэ бараа" />
      <ProductForm
        categories={categories}
        product={{ name: "", slug: "", description: "", price: "", salePrice: null, stock: "", categoryId: "", isFeatured: false, isActive: true, images: [] }}
      />
    </>
  );
}
