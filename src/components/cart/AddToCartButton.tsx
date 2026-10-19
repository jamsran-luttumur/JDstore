"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, type CartItem } from "./CartProvider";
import { IconCart, IconMinus, IconPlus } from "../icons";

type Props = { product: Omit<CartItem, "quantity">; variant?: "card" | "full" };

export function AddToCartButton({ product, variant = "card" }: Props) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const soldOut = product.stock <= 0;

  if (variant === "card") {
    return (
      <button
        type="button"
        disabled={soldOut}
        onClick={() => add(product, 1)}
        className="btn-primary w-full !gap-1.5 !px-2 !py-2 text-[13px] whitespace-nowrap"
        aria-label={`${product.name} сагсанд нэмэх`}
      >
        <IconCart width={16} height={16} className="hidden min-[400px]:block" />
        {soldOut ? "Дууссан" : "Сагсанд нэмэх"}
      </button>
    );
  }

  const max = Math.min(product.stock, 50);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted">Тоо ширхэг</span>
        <div className="flex items-center rounded-xl border border-line">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center text-ink disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={soldOut || qty <= 1}
            aria-label="Хасах"
          >
            <IconMinus width={18} height={18} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={qty}
            disabled={soldOut}
            onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))}
            className="h-11 w-14 border-x border-line text-center text-base font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Тоо ширхэг"
          />
          <button
            type="button"
            className="grid h-11 w-11 place-items-center text-ink disabled:opacity-40"
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            disabled={soldOut || qty >= max}
            aria-label="Нэмэх"
          >
            <IconPlus width={18} height={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" disabled={soldOut} onClick={() => add(product, qty)} className="btn-outline h-12 text-[15px]">
          <IconCart width={18} height={18} />
          Сагсанд нэмэх
        </button>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            add(product, qty);
            router.push("/cart");
          }}
          className="btn-accent h-12 text-[15px]"
        >
          {soldOut ? "Дууссан" : "Шууд авах"}
        </button>
      </div>
    </div>
  );
}
