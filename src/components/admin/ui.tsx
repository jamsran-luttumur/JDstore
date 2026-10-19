import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/constants";

export function AdminHeader({ title, action, children }: { title: string; action?: { href: string; label: string }; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        {children}
        {action && <Link href={action.href} className="btn-primary">{action.label}</Link>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${ORDER_STATUS_COLOR[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

export function Flash({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "warn" | "error" }) {
  const cls = tone === "ok" ? "bg-emerald-50 text-emerald-800" : tone === "warn" ? "bg-amber-50 text-amber-900" : "bg-rose-50 text-rose-700";
  return <p role="status" className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${cls}`}>{children}</p>;
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
