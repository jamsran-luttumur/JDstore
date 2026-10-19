"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "./CartProvider";

export type QuoteLine = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  available: boolean;
  problem?: "not_found" | "out_of_stock" | "insufficient_stock";
};
export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingThreshold: number;
  ok: boolean;
};

/** Сагсны дүнг серверээс (DB үнээр) тооцуулна */
export function useQuote(items: CartItem[], hydrated: boolean, district?: string) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(items.map((i) => [i.productId, i.quantity])) + (district ?? "");

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), district: district || undefined }),
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Алдаа гарлаа");
        setQuote(data);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hydrated]);

  return { quote: items.length > 0 ? quote : null, loading, error };
}
