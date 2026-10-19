"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  /** Зөвхөн харуулахад. Жинхэнэ дүнг сервер тооцно. */
  price: number;
  quantity: number;
  stock: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  hydrated: boolean;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  toast: string | null;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "jdstore_cart_v1";
const MAX = 50;

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.productId === "string" && Number.isInteger(i.quantity) && i.quantity > 0)
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage-оос нэг удаа сэргээнэ
    setItems(load());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* хувийн цонх г.м. үед хадгалахгүй */
    }
  }, [items, hydrated]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const add = useCallback<CartCtx["add"]>(
    (item, qty = 1) => {
      setItems((prev) => {
        const found = prev.find((i) => i.productId === item.productId);
        const limit = Math.max(1, Math.min(item.stock, MAX));
        if (found) {
          return prev.map((i) =>
            i.productId === item.productId ? { ...i, ...item, quantity: Math.min(i.quantity + qty, limit) } : i,
          );
        }
        if (prev.length >= MAX) return prev;
        return [...prev, { ...item, quantity: Math.min(qty, limit) }];
      });
      showToast(`"${item.name}" сагсанд нэмэгдлээ`);
    },
    [showToast],
  );

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(Math.floor(qty) || 1, MAX)) } : i)),
    );
  }, []);

  const remove = useCallback((productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, count: items.reduce((s, i) => s + i.quantity, 0), hydrated, add, setQty, remove, clear, toast }),
    [items, hydrated, add, setQty, remove, clear, toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
        {toast && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-xl">
            <span>{toast}</span>
            <Link href="/cart" className="font-semibold text-accent-400 underline-offset-2 hover:underline">
              Сагс үзэх
            </Link>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart нь CartProvider дотор ашиглагдана");
  return c;
}
