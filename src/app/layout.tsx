import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "JDstore — Онлайн дэлгүүр", template: "%s | JDstore" },
  description: SITE_DESCRIPTION,
  applicationName: "JDstore",
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: "JDstore",
    title: "JDstore — Онлайн дэлгүүр",
    description: SITE_DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "JDstore онлайн дэлгүүр" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1f4ae0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={inter.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
