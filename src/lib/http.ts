import "server-only";
import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "./rate-limit";

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function error(message: string, status = 400, extra?: Record<string, unknown>) {
  return json({ error: message, ...extra }, status);
}

/** JSON body-г хэмжээ хязгаартайгаар уншина */
export async function readJson(req: Request, maxBytes = 32_000): Promise<unknown> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > maxBytes) throw new Error("too_large");
  const text = await req.text();
  if (text.length > maxBytes) throw new Error("too_large");
  return JSON.parse(text);
}

export async function limit(name: string, max: number, windowMs: number) {
  const ip = await clientIp();
  const r = rateLimit(`${name}:${ip}`, max, windowMs);
  if (!r.ok) {
    return error("Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.", 429, { retryAfter: r.retryAfter });
  }
  return null;
}
