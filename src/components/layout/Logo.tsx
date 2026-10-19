import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="JDstore нүүр хуудас">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-500 text-[15px] font-black tracking-tight text-white shadow-sm shadow-accent-500/30">
        JD
      </span>
      <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        JD<span className={light ? "text-brand-200" : "text-brand-600"}>store</span>
      </span>
    </Link>
  );
}
