import Link from "next/link";
import { IconChevronRight } from "./icons";

export function Section({
  title,
  subtitle,
  href,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section className="container-x py-8 sm:py-10" aria-labelledby={id}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id={id} className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:inline-flex">
            Цааш үзэх <IconChevronRight width={16} height={16} />
          </Link>
        )}
      </div>
      {children}
      {href && (
        <div className="mt-5 sm:mt-6 sm:flex sm:justify-center">
          <Link href={href} className="btn-outline w-full sm:w-auto sm:px-8">
            Цааш үзэх <IconChevronRight width={16} height={16} />
          </Link>
        </div>
      )}
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:text-brand-600">
            Нүүр
          </Link>
        </li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            <IconChevronRight width={14} height={14} className="text-slate-400" />
            {it.href ? (
              <Link href={it.href} className="hover:text-brand-600">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="container-x py-6 sm:py-8">
        {children}
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
      </div>
    </div>
  );
}
