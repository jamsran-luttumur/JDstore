"use client";

import { useState } from "react";

export function CopyButton({ value, label = "Хуулах" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard хориглогдсон */
        }
      }}
    >
      {done ? "Хуулсан ✓" : label}
    </button>
  );
}
