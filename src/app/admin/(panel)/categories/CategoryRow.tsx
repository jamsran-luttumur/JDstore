"use client";

import { useActionState } from "react";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/actions";

type Cat = { id?: string; name: string; slug: string; description: string | null; sortOrder: number; count?: number };

export function CategoryForm({ cat }: { cat: Cat }) {
  const [state, action, pending] = useActionState(saveCategoryAction, undefined);
  const [delState, delAction, delPending] = useActionState(deleteCategoryAction, undefined);
  const isNew = !cat.id;
  return (
    <div className="card p-4">
      <form action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_90px_auto] md:items-end">
        {cat.id && <input type="hidden" name="id" value={cat.id} />}
        <div>
          <label className="label text-xs">Нэр</label>
          <input name="name" defaultValue={cat.name} required maxLength={100} className="input !py-2" />
        </div>
        <div>
          <label className="label text-xs">Slug</label>
          <input name="slug" defaultValue={cat.slug} maxLength={100} placeholder="автомат" className="input !py-2 font-mono text-sm" />
        </div>
        <div>
          <label className="label text-xs">Тайлбар</label>
          <input name="description" defaultValue={cat.description ?? ""} maxLength={500} className="input !py-2" />
        </div>
        <div>
          <label className="label text-xs">Эрэмбэ</label>
          <input name="sortOrder" type="number" min={0} defaultValue={cat.sortOrder} className="input !py-2" />
        </div>
        <div className="flex gap-2">
          <button className="btn-primary !py-2" disabled={pending}>{isNew ? "Нэмэх" : "Хадгалах"}</button>
          {cat.id && (
            <button
              formAction={delAction}
              className="btn-outline !py-2 text-rose-600"
              disabled={delPending}
              onClick={(e) => {
                if (!confirm(`"${cat.name}" ангиллыг устгах уу?`)) e.preventDefault();
              }}
            >
              Устгах
            </button>
          )}
        </div>
      </form>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        {cat.count !== undefined && <span className="text-muted">{cat.count} бараа</span>}
        {state?.error && <span className="text-rose-600">{state.error}</span>}
        {state?.ok && <span className="text-emerald-700">{state.message}</span>}
        {delState?.error && <span className="text-rose-600">{delState.error}</span>}
      </div>
    </div>
  );
}
