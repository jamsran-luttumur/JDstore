import Link from "next/link";
import { getCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { IconClock, IconFacebook, IconMail, IconPhone, IconPin } from "../icons";
import { Logo } from "./Logo";

export async function Footer() {
  const [categories, s] = await Promise.all([getCategories(), getSettings()]);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 bg-ink text-slate-300">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo light />
          <p className="text-sm leading-6 text-slate-400">
            JDstore — чанартай бараа, шударга үнэ, хурдан хүргэлттэй онлайн дэлгүүр. QPay, дансаар болон хүргэлтээр бэлнээр төлөх боломжтой.
          </p>
          <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20">
            <IconFacebook width={18} height={18} /> {s.facebookName}
          </a>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Ангилал</h3>
          <ul className="space-y-2.5 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="hover:text-white">{c.name}</Link>
              </li>
            ))}
            <li><Link href="/products?sale=1" className="hover:text-white">Хямдралтай бараа</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Тусламж</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/track" className="hover:text-white">Захиалга шалгах</Link></li>
            <li><Link href="/shipping-returns" className="hover:text-white">Хүргэлт ба буцаалтын нөхцөл</Link></li>
            <li><Link href="/faq" className="hover:text-white">Түгээмэл асуулт</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Нууцлалын бодлого</Link></li>
            <li><Link href="/about" className="hover:text-white">Бидний тухай</Link></li>
            <li><Link href="/contact" className="hover:text-white">Холбоо барих</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Холбоо барих</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={`tel:${s.contactPhone}`} className="flex items-center gap-2 text-base font-bold text-white hover:text-accent-400">
                <IconPhone width={18} height={18} /> {s.contactPhone}
              </a>
            </li>
            <li>
              <a href={`mailto:${s.contactEmail}`} className="flex items-center gap-2 break-all hover:text-white">
                <IconMail width={18} height={18} className="shrink-0" /> {s.contactEmail}
              </a>
            </li>
            <li className="flex items-center gap-2"><IconClock width={18} height={18} /> {s.workingHours}</li>
            <li className="flex items-center gap-2"><IconPin width={18} height={18} /> {s.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row">
          <p>© {year} JDstore. Бүх эрх хуулиар хамгаалагдсан.</p>
          <p className="flex items-center gap-3">
            <span>Төлбөр:</span>
            <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-white">QPay</span>
            <span className="rounded bg-white/10 px-2 py-0.5">Данс</span>
            <span className="rounded bg-white/10 px-2 py-0.5">Бэлэн</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
