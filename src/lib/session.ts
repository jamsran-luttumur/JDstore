import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "jd_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 хоног

function key(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET тохируулаагүй эсвэл хэт богино байна (32+ тэмдэгт)");
  return new TextEncoder().encode(s);
}

export type AdminSession = { sub: string; email: string };

export async function signSession(payload: AdminSession): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .setAudience("jdstore-admin")
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: "jdstore-admin" });
    if (!payload.sub || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
