"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "./icons";

type Banner = { id: string; title: string; subtitle: string | null; imageUrl: string; linkUrl: string | null };

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = banners.length;
  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, paused]);

  if (n === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-brand-900 sm:rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      aria-roledescription="carousel"
      aria-label="Онцлох санал"
    >
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {banners.map((b, k) => {
          const content = (
            <div className="relative aspect-[16/10] w-full sm:aspect-[16/7] lg:aspect-[16/6]">
              <Image src={b.imageUrl} alt="" fill priority={k === 0} sizes="(min-width:1280px) 1232px, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-10 lg:p-14">
                <h2 className="max-w-[16ch] text-2xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">{b.title}</h2>
                {b.subtitle && <p className="max-w-md text-sm text-white/85 sm:text-lg">{b.subtitle}</p>}
                {b.linkUrl && (
                  <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-lg">
                    Дэлгэрэнгүй <IconChevronRight width={16} height={16} />
                  </span>
                )}
              </div>
            </div>
          );
          return (
            <div key={b.id} className="w-full shrink-0" aria-hidden={k !== i} role="group" aria-roledescription="slide" aria-label={`${k + 1} / ${n}`}>
              {b.linkUrl ? (
                <Link href={b.linkUrl} tabIndex={k === i ? 0 : -1} aria-label={b.title}>
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <>
          <button type="button" onClick={() => go(i - 1)} className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow hover:bg-white sm:grid" aria-label="Өмнөх">
            <IconChevronLeft />
          </button>
          <button type="button" onClick={() => go(i + 1)} className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow hover:bg-white sm:grid" aria-label="Дараах">
            <IconChevronRight />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {banners.map((b, k) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(k)}
                className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                aria-label={`${k + 1}-р слайд`}
                aria-current={k === i}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
