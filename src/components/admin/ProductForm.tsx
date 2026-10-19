"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProductAction } from "@/app/admin/actions";
import { ImageUploader } from "./ImageUploader";

type Product = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number | "";
  salePrice: number | null;
  stock: number | "";
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  images: string[];
};

export function ProductForm({ product, categories }: { product: Product; categories: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveProductAction, undefined);
  const [images, setImages] = useState<string[]>(product.images);
  const f = state?.fields ?? {};
  const err = (k: string) => (f[k] ? <p className="mt-1 text-sm text-rose-600">{f[k]}</p> : null);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {product.id && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <div className="space-y-6">
        <section className="card space-y-4 p-5">
          <div>
            <label className="label" htmlFor="name">Нэр *</label>
            <input id="name" name="name" defaultValue={product.name} required maxLength={200} className="input" aria-invalid={!!f.name} />
            {err("name")}
          </div>
          <div>
            <label className="label" htmlFor="slug">URL (slug)</label>
            <input id="slug" name="slug" defaultValue={product.slug} maxLength={100} placeholder="Хоосон бол нэрээс автоматаар үүснэ" className="input font-mono text-sm" aria-invalid={!!f.slug} />
            {err("slug")}
          </div>
          <div>
            <label className="label" htmlFor="description">Тайлбар *</label>
            <textarea id="description" name="description" defaultValue={product.description} required rows={10} maxLength={10000} className="input" aria-invalid={!!f.description} />
            {err("description")}
          </div>
        </section>
        <section className="card space-y-3 p-5">
          <h2 className="font-bold">Зургууд</h2>
          <ImageUploader value={images} onChange={setImages} />
          {err("images")}
        </section>
      </div>

      <div className="space-y-6">
        <section className="card space-y-4 p-5">
          <div>
            <label className="label" htmlFor="price">Үнэ (₮) *</label>
            <input id="price" name="price" inputMode="numeric" defaultValue={product.price} required className="input" aria-invalid={!!f.price} />
            {err("price")}
          </div>
          <div>
            <label className="label" htmlFor="salePrice">Хямдралын үнэ (₮)</label>
            <input id="salePrice" name="salePrice" inputMode="numeric" defaultValue={product.salePrice ?? ""} placeholder="Хямдралгүй бол хоосон" className="input" aria-invalid={!!f.salePrice} />
            {err("salePrice")}
          </div>
          <div>
            <label className="label" htmlFor="stock">Үлдэгдэл *</label>
            <input id="stock" name="stock" inputMode="numeric" defaultValue={product.stock} required className="input" aria-invalid={!!f.stock} />
            {err("stock")}
          </div>
          <div>
            <label className="label" htmlFor="categoryId">Ангилал *</label>
            <select id="categoryId" name="categoryId" defaultValue={product.categoryId} required className="input" aria-invalid={!!f.categoryId}>
              <option value="" disabled>Сонгох</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {err("categoryId")}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} className="h-4 w-4 accent-brand-600" /> Онцлох бараа (нүүр хуудсанд)</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={product.isActive} className="h-4 w-4 accent-brand-600" /> Идэвхтэй (дэлгүүрт харагдана)</label>
        </section>
        {state?.error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={pending}>{pending ? "Хадгалж байна..." : "Хадгалах"}</button>
          <Link href="/admin/products" className="btn-outline">Болих</Link>
        </div>
      </div>
    </form>
  );
}
