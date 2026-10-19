"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconClose, IconFacebook, IconMail, IconMenu, IconPhone } from "../icons";
import { Logo } from "./Logo";

type Props = {
  categories: { name: string; slug: string }[];
  phone: string;
  email: string;
  facebookUrl: string;
};

export function MobileMenu({ categories, phone, email, facebookUrl }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- хуудас солигдоход цэсийг хаана
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="grid h-11 w-11 place-items-center rounded-xl text-ink hover:bg-surface lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Цэс нээх"
        aria-expanded={open}
      >
        <IconMenu width={24} height={24} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Цэс">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <Logo />
              <button type="button" className="grid h-11 w-11 place-items-center rounded-xl hover:bg-surface" onClick={() => setOpen(false)} aria-label="Цэс хаах">
                <IconClose width={24} height={24} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-3">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">Ангилал</p>
              <Link href="/products" className="block rounded-lg px-3 py-3 font-semibold hover:bg-surface">
                Бүх бараа
              </Link>
              {categories.map((c) => (
                <Link key={c.slug} href={`/category/${c.slug}`} className="block rounded-lg px-3 py-3 hover:bg-surface">
                  {c.name}
                </Link>
              ))}
              <Link href="/products?sale=1" className="block rounded-lg px-3 py-3 font-semibold text-accent-600 hover:bg-surface">
                Хямдралтай бараа
              </Link>
              <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-muted">Мэдээлэл</p>
              {[
                ["/track", "Захиалга шалгах"],
                ["/about", "Бидний тухай"],
                ["/contact", "Холбоо барих"],
                ["/faq", "Түгээмэл асуулт"],
                ["/shipping-returns", "Хүргэлт ба буцаалт"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="block rounded-lg px-3 py-3 hover:bg-surface">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="space-y-2 border-t border-line p-4 text-sm">
              <a href={`tel:${phone}`} className="flex items-center gap-2 font-semibold text-brand-700">
                <IconPhone width={18} height={18} /> {phone}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 text-muted">
                <IconMail width={18} height={18} /> {email}
              </a>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted">
                <IconFacebook width={18} height={18} /> Facebook
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
