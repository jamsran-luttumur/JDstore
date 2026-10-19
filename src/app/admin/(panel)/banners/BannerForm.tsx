"use client";

import { useActionState, useState } from "react";
import { saveBannerAction } from "@/app/admin/actions";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Banner = { id?: string; title: string; subtitle: string | null; imageUrl: string; linkUrl: string | null; sortOrder: number; isActive: boolean };

export function BannerForm({ banner, children }: { banner: Banner; children?: React.ReactNode }) {
  const [state, action, pending] = useActionState(saveBannerAction, undefined);
  const [img, setImg] = useState(banner.imageUrl ? [banner.imageUrl] : []);
  return (
    <div className="card space-y-4 p-4 sm:p-5">
      <ImageUploader value={img} onChange={setImg} single />
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        {banner.id && <input type="hidden" name="id" value={banner.id} />}
        <input type="hidden" name="imageUrl" value={img[0] ?? ""} />
        <div>
          <label className="label text-xs">Гарчиг *</label>
          <input name="title" defaultValue={banner.title} required maxLength={120} className="input !py-2" />
        </div>
        <div>
          <label className="label text-xs">Дэд гарчиг</label>
          <input name="subtitle" defaultValue={banner.subtitle ?? ""} maxLength={240} className="input !py-2" />
        </div>
        <div>
          <label className="label text-xs">Холбоос (жишээ: /category/electronics)</label>
          <input name="linkUrl" defaultValue={banner.linkUrl ?? ""} maxLength={300} className="input !py-2" />
        </div>
        <div className="grid grid-cols-[100px_1fr] items-end gap-3">
          <div>
            <label className="label text-xs">Эрэмбэ</label>
            <input name="sortOrder" type="number" min={0} defaultValue={banner.sortOrder} className="input !py-2" />
          </div>
          <label className="flex items-center gap-2 pb-2.5 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={banner.isActive} className="h-4 w-4 accent-brand-600" /> Идэвхтэй
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button className="btn-primary" disabled={pending || img.length === 0}>{banner.id ? "Хадгалах" : "Баннер нэмэх"}</button>
          {children}
          {state?.error && <span className="text-sm text-rose-600">{state.error}</span>}
          {state?.ok && <span className="text-sm text-emerald-700">{state.message}</span>}
        </div>
      </form>
    </div>
  );
}
