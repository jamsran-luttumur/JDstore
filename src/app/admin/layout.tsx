import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Админ", template: "%s · JDstore админ" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-surface">{children}</div>;
}
