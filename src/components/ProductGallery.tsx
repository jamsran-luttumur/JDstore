"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, name }: { images: { url: string; alt: string | null }[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return <div className="grid aspect-square place-items-center rounded-2xl bg-surface text-muted">Зураггүй</div>;
  }
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
        <Image
          src={current.url}
          alt={current.alt || name}
          fill
          priority
          sizes="(min-width:1024px) 560px, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Зургууд">
          {images.map((img, k) => (
            <button
              key={img.url + k}
              type="button"
              role="tab"
              aria-selected={k === active}
              aria-label={`${k + 1}-р зураг`}
              onClick={() => setActive(k)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-surface transition sm:h-24 sm:w-24 ${
                k === active ? "border-brand-600" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
