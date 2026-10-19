import Link from "next/link";
import { Suspense } from "react";
import { getCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { CartButton } from "../cart/CartButton";
import { IconFacebook, IconMail, IconPackage, IconPhone } from "../icons";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { SearchBox } from "./SearchBox";

export async function Header() {
  const [categories, s] = await Promise.all([getCategories(), getSettings()]);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="hidden bg-ink text-[13px] text-slate-300 sm:block">
        <div className="container-x flex h-9 items-center justify-between gap-4">
          <p className="truncate">100,000₮-өөс дээш захиалгад Улаанбаатар хотод үнэгүй хүргэлт</p>
          <div className="flex shrink-0 items-center gap-5">
            <a href={`tel:${s.contactPhone}`} className="flex items-center gap-1.5 font-semibold text-white hover:text-accent-400">
              <IconPhone width={15} height={15} /> {s.contactPhone}
            </a>
            <a href={`mailto:${s.contactEmail}`} className="hidden items-center gap-1.5 hover:text-white md:flex">
              <IconMail width={15} height={15} /> {s.contactEmail}
            </a>
            <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white" aria-label="Facebook хуудас">
              <IconFacebook width={15} height={15} />
            </a>
          </div>
        </div>
      </div>

      <div className="container-x flex h-16 items-center gap-2 sm:gap-4">
        <MobileMenu
          categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
          phone={s.contactPhone}
          email={s.contactEmail}
          facebookUrl={s.facebookUrl}
        />
        <Logo />
        <Suspense fallback={<div className="hidden flex-1 md:block" />}>
          <SearchBox className="mx-4 hidden max-w-xl flex-1 md:block" />
        </Suspense>
        <div className="ml-auto flex items-center gap-1">
          <a href={`tel:${s.contactPhone}`} className="grid h-11 w-11 place-items-center rounded-xl text-ink hover:bg-surface sm:hidden" aria-label={`Залгах: ${s.contactPhone}`}>
            <IconPhone width={22} height={22} />
          </a>
          <Link href="/track" className="hidden h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink hover:bg-surface sm:inline-flex">
            <IconPackage width={22} height={22} />
            <span className="hidden lg:inline">Захиалга шалгах</span>
          </Link>
          <CartButton />
        </div>
      </div>

      <div className="container-x pb-3 md:hidden">
        <Suspense fallback={<div className="h-11" />}>
          <SearchBox id="site-search-mobile" />
        </Suspense>
      </div>

      <nav className="hidden border-t border-line lg:block" aria-label="Ангилал">
        <div className="container-x flex h-12 items-center gap-1 overflow-x-auto no-scrollbar text-sm font-medium">
          <Link href="/products" className="rounded-lg px-3 py-2 font-semibold text-ink hover:bg-surface">
            Бүх бараа
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="whitespace-nowrap rounded-lg px-3 py-2 text-slate-700 hover:bg-surface hover:text-ink">
              {c.name}
            </Link>
          ))}
          <Link href="/products?sale=1" className="whitespace-nowrap rounded-lg px-3 py-2 font-semibold text-accent-600 hover:bg-accent-50">
            Хямдрал
          </Link>
        </div>
      </nav>
    </header>
  );
}
