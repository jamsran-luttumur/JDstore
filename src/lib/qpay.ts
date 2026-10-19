import "server-only";
import QRCode from "qrcode";
import { randomToken } from "./tokens";

/**
 * QPay Merchant API v2 клиент.
 *  - sandbox:    https://merchant-sandbox.qpay.mn
 *  - production: https://merchant.qpay.mn
 *  - mock:       сүлжээгүй локал туршилт (ЖИНХЭНЭ төлбөр биш)
 */

export type QPayMode = "sandbox" | "production" | "mock";

export function qpayMode(): QPayMode {
  const m = (process.env.QPAY_MODE || "sandbox").toLowerCase();
  return m === "production" || m === "mock" ? m : "sandbox";
}

function baseUrl() {
  if (process.env.QPAY_BASE_URL) return process.env.QPAY_BASE_URL.replace(/\/+$/, "");
  return qpayMode() === "production" ? "https://merchant.qpay.mn" : "https://merchant-sandbox.qpay.mn";
}

export type QPayDeeplink = { name: string; description?: string; logo?: string; link: string };

export type QPayInvoice = {
  invoiceId: string;
  qrText: string;
  qrImage: string; // base64 PNG
  shortUrl?: string;
  urls: QPayDeeplink[];
};

export type QPayCheckRow = {
  payment_id: string;
  payment_status: string; // "PAID" | "FAILED" | ...
  payment_amount: string | number;
  payment_currency?: string;
  payment_date?: string;
};

export type QPayCheckResult = { count: number; paidAmount: number; rows: QPayCheckRow[]; raw: unknown };

// ───────── Токен (санах ойд кэшлэнэ) ─────────
let tokenCache: { accessToken: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  const id = process.env.QPAY_CLIENT_ID;
  const secret = process.env.QPAY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("QPAY_CLIENT_ID / QPAY_CLIENT_SECRET тохируулаагүй");
  const res = await fetch(`${baseUrl()}/v2/auth/token`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64") },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`QPay токен авахад алдаа: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  // expires_in нь зарим орчинд unix timestamp (секунд), заримд нь хугацаа (секунд) байдаг
  const exp = Number(data.expires_in || 0);
  const expiresAt = exp > 1e9 ? exp * 1000 : Date.now() + (exp || 3600) * 1000;
  tokenCache = { accessToken: data.access_token, expiresAt };
  return data.access_token;
}

async function api<T>(path: string, body: unknown, retry = true): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 401 && retry) {
    tokenCache = null;
    return api<T>(path, body, false);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`QPay ${path} алдаа ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

// ───────── Mock (локал туршилт) ─────────
type MockInvoice = { amount: number; paid: boolean; paymentId?: string };
const g = globalThis as unknown as { __qpayMock?: Map<string, MockInvoice> };
const mockStore = (g.__qpayMock ??= new Map());

export function mockMarkPaid(invoiceId: string): boolean {
  const inv = mockStore.get(invoiceId);
  if (!inv) return false;
  inv.paid = true;
  inv.paymentId ??= `MOCKPAY-${randomToken(6)}`;
  return true;
}

// ───────── Нийтийн функцууд ─────────
export async function createInvoice(opts: {
  senderInvoiceNo: string;
  amount: number;
  description: string;
  callbackUrl: string;
  receiverPhone?: string;
}): Promise<QPayInvoice> {
  if (qpayMode() === "mock") {
    const invoiceId = `MOCK-${randomToken(10)}`;
    mockStore.set(invoiceId, { amount: opts.amount, paid: false });
    const qrText = `MOCK:${invoiceId}:${opts.amount}`;
    const dataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 300 });
    return { invoiceId, qrText, qrImage: dataUrl.replace(/^data:image\/png;base64,/, ""), urls: [] };
  }

  const data = await api<{
    invoice_id: string;
    qr_text: string;
    qr_image: string;
    qPay_shortUrl?: string;
    urls?: QPayDeeplink[];
  }>("/v2/invoice", {
    invoice_code: process.env.QPAY_INVOICE_CODE,
    sender_invoice_no: opts.senderInvoiceNo,
    invoice_receiver_code: process.env.QPAY_INVOICE_RECEIVER_CODE || "terminal",
    invoice_description: opts.description.slice(0, 255),
    invoice_receiver_data: opts.receiverPhone ? { phone: opts.receiverPhone } : undefined,
    amount: opts.amount,
    callback_url: opts.callbackUrl,
  });
  return {
    invoiceId: data.invoice_id,
    qrText: data.qr_text,
    qrImage: data.qr_image,
    shortUrl: data.qPay_shortUrl,
    urls: Array.isArray(data.urls) ? data.urls : [],
  };
}

/** Invoice-ийн төлбөрийг QPay API-аас ШУУД шалгана (callback-д итгэхгүй). */
export async function checkInvoice(invoiceId: string): Promise<QPayCheckResult> {
  if (qpayMode() === "mock") {
    const inv = mockStore.get(invoiceId);
    if (!inv?.paid) return { count: 0, paidAmount: 0, rows: [], raw: { mock: true } };
    const rows = [{ payment_id: inv.paymentId!, payment_status: "PAID", payment_amount: inv.amount, payment_currency: "MNT" }];
    return { count: 1, paidAmount: inv.amount, rows, raw: { mock: true, rows } };
  }
  const data = await api<{ count: number; paid_amount?: number | string; rows?: QPayCheckRow[] }>("/v2/payment/check", {
    object_type: "INVOICE",
    object_id: invoiceId,
    offset: { page_number: 1, page_limit: 100 },
  });
  return {
    count: Number(data.count || 0),
    paidAmount: Number(data.paid_amount || 0),
    rows: Array.isArray(data.rows) ? data.rows : [],
    raw: data,
  };
}

export async function cancelInvoice(invoiceId: string): Promise<void> {
  if (qpayMode() === "mock") {
    mockStore.delete(invoiceId);
    return;
  }
  const token = await getToken();
  await fetch(`${baseUrl()}/v2/invoice/${encodeURIComponent(invoiceId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => undefined);
}
