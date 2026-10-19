"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { IconCart } from "../icons";

export function CartButton() {
  const { count, hydrated } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex h-11 items-center gap-2 rounded-xl px-3 text-ink hover:bg-surface"
      aria-label={`Сагс, ${count} бараа`}
    >
      <IconCart width={24} height={24} />
      <span className="hidden text-sm font-medium lg:inline">Сагс</span>
      {hydrated && count > 0 && (
        <span className="absolute -top-0.5 left-6 min-w-5 rounded-full bg-accent-500 px-1.5 text-center text-[11px] font-bold leading-5 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
