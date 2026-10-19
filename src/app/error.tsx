"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Алдаа гарлаа</h1>
        <p className="text-muted">Түр зуурын саатал гарлаа. Дахин оролдоно уу.</p>
        <button type="button" onClick={reset} className="btn-primary">Дахин оролдох</button>
      </div>
    </div>
  );
}
