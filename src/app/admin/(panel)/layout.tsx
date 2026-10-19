import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const pending = await prisma.order.count({ where: { status: "PENDING" } });
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-30 bg-ink px-3 py-3 lg:h-dvh lg:px-4 lg:py-6">
        <div className="mb-3 flex items-center justify-between gap-2 lg:mb-8 lg:block">
          <Link href="/admin" className="flex items-center gap-2 text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-500 text-sm font-black">JD</span>
            <span className="font-extrabold">Админ</span>
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/" target="_blank" className="text-xs text-slate-400 hover:text-white">Дэлгүүр ↗</Link>
            <form action={logoutAction}><button className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white">Гарах</button></form>
          </div>
        </div>
        <AdminNav pendingCount={pending} />
        <div className="mt-8 hidden space-y-3 border-t border-white/10 pt-6 text-sm lg:block">
          <p className="truncate text-slate-400" title={session.email}>{session.email}</p>
          <Link href="/" target="_blank" className="block text-slate-300 hover:text-white">Дэлгүүр үзэх ↗</Link>
          <form action={logoutAction}>
            <button className="text-slate-300 hover:text-white">Гарах</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
