"use client";

import Image from "next/image";
import { useRef, useState } from "react";

async function upload(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload амжилтгүй");
  return data.url as string;
}

export function ImageUploader({ value, onChange, max = 10, single = false }: { value: string[]; onChange: (urls: string[]) => void; max?: number; single?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, single ? 1 : max - value.length)) {
      try {
        urls.push(await upload(f));
      } catch (e) {
        setError(`${f.name}: ${(e as Error).message}`);
      }
    }
    onChange(single ? urls.slice(0, 1).concat(urls.length ? [] : value) : [...value, ...urls]);
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  const move = (i: number, d: number) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className={single ? "" : "grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5"}>
          {value.map((url, i) => (
            <li key={url + i} className={`group relative overflow-hidden rounded-xl border border-line bg-surface ${single ? "aspect-[16/6] max-w-xl" : "aspect-square"}`}>
              <Image src={url} alt="" fill sizes="200px" className="object-cover" />
              {!single && i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-ink/80 px-1.5 text-[10px] font-bold text-white">Үндсэн</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                {!single && (
                  <span className="flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} className="rounded bg-white/90 px-1.5 text-xs" aria-label="Зүүн тийш">←</button>
                    <button type="button" onClick={() => move(i, 1)} className="rounded bg-white/90 px-1.5 text-xs" aria-label="Баруун тийш">→</button>
                  </span>
                )}
                <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="ml-auto rounded bg-rose-600 px-1.5 text-xs font-semibold text-white">Устгах</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {(single || value.length < max) && (
        <label className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-white p-5 text-center text-sm hover:border-brand-300 ${busy ? "pointer-events-none opacity-60" : ""}`}>
          <span className="font-semibold text-brand-700">{busy ? "Хуулж байна..." : single && value.length ? "Зураг солих" : "Зураг сонгох"}</span>
          <span className="text-xs text-muted">JPG, PNG, WEBP · 5MB хүртэл · автоматаар WebP болгож шахна</span>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={!single} className="sr-only" onChange={(e) => onFiles(e.target.files)} />
        </label>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
