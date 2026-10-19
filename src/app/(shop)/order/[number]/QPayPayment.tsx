"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Deeplink = { name: string; description?: string; logo?: string; link: string };
type Invoice = { mode: string; amount: number; qrImage: string; qrText: string; shortUrl?: string | null; deeplinks: Deeplink[] };

export function QPayPayment({ orderNumber, token }: { orderNumber: string; token: string }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const done = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/qpay/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "QPay нэхэмжлэх үүсгэж чадсангүй");
      if (data.status && data.status !== "PENDING") {
        router.refresh();
        return;
      }
      setInvoice(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [orderNumber, token, router]);

  const check = useCallback(
    async (manual = false) => {
      if (done.current) return;
      if (manual) setChecking(true);
      try {
        const res = await fetch("/api/qpay/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber, token }),
        });
        const data = await res.json();
        if (res.ok && data.status && data.status !== "PENDING") {
          done.current = true;
          router.refresh();
        } else if (manual) {
          setMsg("Төлбөр хараахан орж ирээгүй байна. Төлсөн бол хэдэн секунд хүлээгээд дахин шалгана уу.");
        }
      } finally {
        if (manual) setChecking(false);
      }
    },
    [orderNumber, token, router],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- нэхэмжлэхийг нэг удаа ачаална
    load();
  }, [load]);

  useEffect(() => {
    if (!invoice) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, 5000);
    return () => clearInterval(t);
  }, [invoice, check]);

  if (error) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
        <button type="button" className="btn-primary" onClick={load}>Дахин оролдох</button>
      </div>
    );
  }
  if (!invoice) return <div className="mx-auto h-64 w-64 animate-pulse rounded-2xl bg-surface" aria-label="QR ачаалж байна" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- QPay-ийн base64 QR */}
        <img src={`data:image/png;base64,${invoice.qrImage}`} alt="QPay QR код" width={256} height={256} className="h-64 w-64 rounded-2xl border border-line bg-white p-2 [image-rendering:pixelated]" />
        <p className="text-center text-sm text-muted">Банкны аппаараа QR кодыг уншуулж төлнө үү. Төлбөр орсны дараа энэ хуудас автоматаар шинэчлэгдэнэ.</p>
      </div>

      {invoice.deeplinks.length > 0 && (
        <div className="sm:hidden">
          <p className="mb-2 text-sm font-semibold">Утсан дээрх банкны апп-аар төлөх:</p>
          <div className="grid grid-cols-3 gap-2">
            {invoice.deeplinks.map((d) => (
              <a key={d.name + d.link} href={d.link} className="flex flex-col items-center gap-1 rounded-xl border border-line p-2 text-center text-[11px] hover:bg-surface">
                {d.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.logo} alt="" width={40} height={40} className="h-10 w-10 rounded-lg" loading="lazy" />
                )}
                <span className="line-clamp-2">{d.description || d.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn-primary flex-1" onClick={() => check(true)} disabled={checking}>
          {checking ? "Шалгаж байна..." : "Төлбөр шалгах"}
        </button>
        {invoice.mode === "mock" && (
          <button
            type="button"
            className="btn-outline flex-1 border-dashed"
            onClick={async () => {
              await fetch("/api/qpay/mock-pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber, token }) });
              await check(true);
            }}
          >
            🧪 Туршилтын төлбөр хийх (mock)
          </button>
        )}
      </div>
      {msg && <p className="text-sm text-muted" aria-live="polite">{msg}</p>}
    </div>
  );
}
