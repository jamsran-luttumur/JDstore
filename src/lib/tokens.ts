import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET тохируулаагүй эсвэл хэт богино байна (32+ тэмдэгт)");
  return s;
}

/** Захиалгын хуудсыг зөвхөн захиалагч харах боломжтой болгох токен */
export function orderAccessToken(orderNumber: string): string {
  return createHmac("sha256", secret()).update(`order:${orderNumber}`).digest("base64url").slice(0, 32);
}

export function verifyOrderAccessToken(orderNumber: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(orderAccessToken(orderNumber));
  const got = Buffer.from(token);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function randomDigits(n: number): string {
  const buf = randomBytes(n);
  return Array.from(buf, (b) => (b % 10).toString()).join("");
}
