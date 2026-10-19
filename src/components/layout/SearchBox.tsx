"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { IconSearch } from "../icons";

export function SearchBox({ className = "", id = "site-search" }: { className?: string; id?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim().slice(0, 100);
        router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
      }}
    >
      <label htmlFor={id} className="sr-only">
        Бараа хайх
      </label>
      <input
        id={id}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        maxLength={100}
        placeholder="Бараа хайх..."
        className="h-11 w-full rounded-xl border border-line bg-surface pl-4 pr-12 text-[15px] placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
      />
      <button
        type="submit"
        className="absolute right-1 top-1 grid h-9 w-10 place-items-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
        aria-label="Хайх"
      >
        <IconSearch width={18} height={18} />
      </button>
    </form>
  );
}
