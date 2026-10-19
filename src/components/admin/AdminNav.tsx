"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Хяналт" },
  { href: "/admin/orders", label: "Захиалга" },
  { href: "/admin/products", label: "Бараа" },
  { href: "/admin/categories", label: "Ангилал" },
  { href: "/admin/banners", label: "Баннер" },
  { href: "/admin/settings", label: "Тохиргоо" },
];

export function AdminNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col" aria-label="Админ цэс">
      {links.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
              active ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {l.label}
            {l.href === "/admin/orders" && pendingCount > 0 && (
              <span className={`rounded-full px-2 text-xs font-bold ${active ? "bg-white text-brand-700" : "bg-accent-500 text-white"}`}>{pendingCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
