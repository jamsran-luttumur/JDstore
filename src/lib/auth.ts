import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type AdminSession } from "./session";

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  // Устгагдсан админы токен хүчингүй болно
  const exists = await prisma.adminUser.findUnique({ where: { id: session.sub }, select: { id: true } });
  return exists ? session : null;
}

/** Админ хуудас, server action бүрийн эхэнд дуудна */
export async function requireAdmin(): Promise<AdminSession> {
  const s = await getAdminSession();
  if (!s) redirect("/admin/login");
  return s;
}

// Хэрэглэгч олдоогүй үед ч ижил хугацаа зарцуулахын тулд
const DUMMY_HASH = "$2b$12$FtuE/P.MS25OWWER2YC4SuNQ77IomrNcSgnVfByC.iHwte6oFqr6e";

export async function verifyAdminCredentials(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  return ok && user ? user : null;
}

export async function startAdminSession(user: { id: string; email: string }) {
  const token = await signSession({ sub: user.id, email: user.email });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endAdminSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
