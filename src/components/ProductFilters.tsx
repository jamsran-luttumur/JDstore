"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SORT_OPTIONS } from "@/lib/constants";
import { IconFilter } from "./icons";

type Props = { categories: { name: string; slug: string }[]; fixedCategory?: string };

export function ProductFilters({ categories, fixedCategory }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const current = params.get("category") ?? "";
  const panel = (
    <div className="space-y-6">
      {!fixedCategory && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-ink">Ангилал</legend>
          <div className="space-y-1">
            {[{ name: "Бүгд", slug: "" }, ...categories].map((c) => (
              <label key={c.slug || "all"} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface">
                <input
                  type="radio"
                  name="category"
                  className="h-4 w-4 accent-brand-600"
                  checked={current === c.slug}
                  onChange={() => update({ category: c.slug || null })}
                />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink">Үнэ (₮)</legend>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: min.replace(/\D/g, ""), max: max.replace(/\D/g, "") });
            setOpen(false);
          }}
        >
          <div className="flex items-center gap-2">
            <input className="input !py-2 text-sm" inputMode="numeric" placeholder="Доод" value={min} onChange={(e) => setMin(e.target.value)} aria-label="Доод үнэ" />
            <span className="text-muted">–</span>
            <input className="input !py-2 text-sm" inputMode="numeric" placeholder="Дээд" value={max} onChange={(e) => setMax(e.target.value)} aria-label="Дээд үнэ" />
          </div>
          <button className="btn-outline w-full !py-2">Шүүх</button>
        </form>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-bold text-ink">Бусад</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={params.get("sale") === "1"} onChange={(e) => update({ sale: e.target.checked ? "1" : null })} />
          Зөвхөн хямдралтай
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={params.get("stock") === "1"} onChange={(e) => update({ stock: e.target.checked ? "1" : null })} />
          Зөвхөн бэлэн байгаа
        </label>
      </fieldset>

      {[...params.keys()].some((k) => k !== "sort" && k !== "page") && (
        <button
          type="button"
          className="text-sm font-semibold text-brand-600 hover:underline"
          onClick={() => {
            setMin("");
            setMax("");
            router.push(pathname);
          }}
        >
          Шүүлтүүрийг цэвэрлэх
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-2 lg:hidden">
        <button type="button" className="btn-outline !py-2" onClick={() => setOpen(true)}>
          <IconFilter width={16} height={16} /> Шүүлтүүр
        </button>
      </div>
      <aside className="hidden lg:block">{panel}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Шүүлтүүр">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">Шүүлтүүр</p>
              <button type="button" className="btn-ghost !px-3" onClick={() => setOpen(false)}>Хаах</button>
            </div>
            {panel}
          </div>
        </div>
      )}
    </>
  );
}

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">Эрэмбэлэх:</span>
      <select
        className="input !w-auto !py-2 text-sm"
        value={params.get("sort") ?? "new"}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === "new") next.delete("sort");
          else next.set("sort", e.target.value);
          next.delete("page");
          const qs = next.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }}
        aria-label="Эрэмбэлэх"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
