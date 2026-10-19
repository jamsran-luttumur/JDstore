"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type OrderStatus } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { endAdminSession, hashPassword, requireAdmin, startAdminSession, verifyAdminCredentials } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/format";
import { changeOrderStatus, OrderError } from "@/lib/orders";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { SETTING_KEYS, type StoreSettings } from "@/lib/settings";
import { bannerSchema, categorySchema, fieldErrors, firstError, productSchema } from "@/lib/validation";

export type ActionState = { ok?: boolean; error?: string; fields?: Record<string, string>; message?: string } | undefined;

function refreshStore() {
  revalidatePath("/", "layout");
}

// ───────── Нэвтрэлт ─────────
export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const ip = await clientIp();
  const rl = rateLimit(`login:${ip}`, 8, 15 * 60_000);
  if (!rl.ok) return { error: `Хэт олон оролдлого. ${Math.ceil(rl.retryAfter / 60)} минутын дараа дахин оролдоно уу.` };
  const email = String(fd.get("email") ?? "").slice(0, 200);
  const password = String(fd.get("password") ?? "").slice(0, 200);
  if (!email || !password) return { error: "И-мэйл, нууц үгээ оруулна уу" };
  const user = await verifyAdminCredentials(email, password);
  if (!user) return { error: "И-мэйл эсвэл нууц үг буруу байна" };
  resetRateLimit(`login:${ip}`);
  await startAdminSession(user);
  redirect("/admin");
}

export async function logoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

// ───────── Бараа ─────────
function parseProductForm(fd: FormData) {
  let images: unknown = [];
  try {
    images = JSON.parse(String(fd.get("images") ?? "[]"));
  } catch {
    images = [];
  }
  return productSchema.safeParse({
    name: fd.get("name") ?? "",
    slug: fd.get("slug") ?? "",
    description: fd.get("description") ?? "",
    price: fd.get("price") ?? "",
    salePrice: fd.get("salePrice") ?? "",
    stock: fd.get("stock") ?? "",
    categoryId: fd.get("categoryId") ?? "",
    isFeatured: fd.get("isFeatured") === "on",
    isActive: fd.get("isActive") === "on",
    images,
  });
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = base || `product-${Date.now().toString(36)}`;
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const hit = await prisma.product.findFirst({ where: { slug, ...(excludeId && { id: { not: excludeId } }) }, select: { id: true } });
    if (!hit) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function saveProductAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "") || undefined;
  const parsed = parseProductForm(fd);
  if (!parsed.success) return { error: firstError(parsed.error), fields: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (!(await prisma.category.findUnique({ where: { id: d.categoryId } }))) return { error: "Ангилал олдсонгүй" };
  const slug = await uniqueSlug(d.slug || slugify(d.name), id);
  const data = {
    name: d.name,
    slug,
    description: d.description,
    price: d.price,
    salePrice: d.salePrice,
    stock: d.stock,
    categoryId: d.categoryId,
    isFeatured: d.isFeatured,
    isActive: d.isActive,
  };
  const images = d.images.map((url, i) => ({ url, alt: d.name, sortOrder: i }));

  if (id) {
    await prisma.$transaction([
      prisma.product.update({ where: { id }, data }),
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.productImage.createMany({ data: images.map((im) => ({ ...im, productId: id })) }),
    ]);
  } else {
    await prisma.product.create({ data: { ...data, images: { create: images } } });
  }
  refreshStore();
  redirect("/admin/products?saved=1");
}

export async function deleteProductAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const used = await prisma.orderItem.count({ where: { productId: id } });
  if (used > 0) {
    // Захиалгын түүхэнд холбогдсон тул нууж (идэвхгүй) болгоно
    await prisma.product.update({ where: { id }, data: { isActive: false, isFeatured: false } });
    refreshStore();
    redirect("/admin/products?archived=1");
  }
  await prisma.product.delete({ where: { id } }).catch(() => undefined);
  refreshStore();
  redirect("/admin/products?deleted=1");
}

export async function toggleProductFlagAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const flag = String(fd.get("flag") ?? "");
  if (flag !== "isFeatured" && flag !== "isActive") return;
  const p = await prisma.product.findUnique({ where: { id }, select: { isFeatured: true, isActive: true } });
  if (!p) return;
  await prisma.product.update({ where: { id }, data: { [flag]: !p[flag] } });
  refreshStore();
  revalidatePath("/admin/products");
}

// ───────── Ангилал ─────────
export async function saveCategoryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "") || undefined;
  const parsed = categorySchema.safeParse({
    name: fd.get("name") ?? "",
    slug: fd.get("slug") ?? "",
    description: fd.get("description") ?? "",
    sortOrder: fd.get("sortOrder") || 0,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const slug = d.slug || slugify(d.name) || `cat-${Date.now().toString(36)}`;
  try {
    const data = { name: d.name, slug, description: d.description || null, sortOrder: d.sortOrder };
    if (id) await prisma.category.update({ where: { id }, data });
    else await prisma.category.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "Ийм slug-тай ангилал байна" };
    throw e;
  }
  refreshStore();
  revalidatePath("/admin/categories");
  return { ok: true, message: "Хадгаллаа" };
}

export async function deleteCategoryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) return { error: `Энэ ангилалд ${count} бараа байна. Эхлээд барааг өөр ангилалд шилжүүлнэ үү.` };
  await prisma.category.delete({ where: { id } }).catch(() => undefined);
  refreshStore();
  revalidatePath("/admin/categories");
  return { ok: true, message: "Устгалаа" };
}

// ───────── Баннер ─────────
export async function saveBannerAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "") || undefined;
  const parsed = bannerSchema.safeParse({
    title: fd.get("title") ?? "",
    subtitle: fd.get("subtitle") ?? "",
    imageUrl: fd.get("imageUrl") ?? "",
    linkUrl: fd.get("linkUrl") ?? "",
    sortOrder: fd.get("sortOrder") || 0,
    isActive: fd.get("isActive") === "on",
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const data = { title: d.title, subtitle: d.subtitle || null, imageUrl: d.imageUrl, linkUrl: d.linkUrl || null, sortOrder: d.sortOrder, isActive: d.isActive };
  if (id) await prisma.banner.update({ where: { id }, data });
  else await prisma.banner.create({ data });
  refreshStore();
  revalidatePath("/admin/banners");
  return { ok: true, message: "Хадгаллаа" };
}

export async function deleteBannerAction(fd: FormData) {
  await requireAdmin();
  await prisma.banner.delete({ where: { id: String(fd.get("id") ?? "") } }).catch(() => undefined);
  refreshStore();
  revalidatePath("/admin/banners");
}

// ───────── Захиалга ─────────
const STATUSES = ["PENDING", "PAID", "SHIPPING", "DELIVERED", "CANCELLED"] as const;

export async function updateOrderStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = z.enum(STATUSES).safeParse(fd.get("status"));
  if (!status.success) return { error: "Төлөв буруу" };
  try {
    await changeOrderStatus(id, status.data as OrderStatus);
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  refreshStore();
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: "Төлөв шинэчлэгдлээ" };
}

// ───────── Тохиргоо ─────────
const settingsSchema = z.object({
  contactPhone: z.string().trim().regex(/^\+?[\d\s-]{6,20}$/, "Утасны дугаар буруу"),
  contactEmail: z.string().trim().email("И-мэйл буруу"),
  facebookUrl: z.string().trim().url("Facebook холбоос буруу").refine((u) => u.startsWith("https://"), "https://-ээр эхэлнэ"),
  facebookName: z.string().trim().min(1).max(100),
  address: z.string().trim().max(200),
  workingHours: z.string().trim().max(100),
  bankName: z.string().trim().max(100),
  bankAccount: z.string().trim().max(50),
  bankHolder: z.string().trim().max(100),
  bankIban: z.string().trim().max(50),
  shippingFeeUB: z.coerce.number().int().min(0).max(10_000_000),
  shippingFeeRural: z.coerce.number().int().min(0).max(10_000_000),
  freeShippingThreshold: z.coerce.number().int().min(0).max(1_000_000_000),
  notifyEmail: z.string().trim().email("Мэдэгдлийн и-мэйл буруу"),
});

export async function saveSettingsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const numeric = new Set(["shippingFeeUB", "shippingFeeRural", "freeShippingThreshold"]);
  const raw = Object.fromEntries(
    Object.keys(SETTING_KEYS).map((k) => {
      const v = String(fd.get(k) ?? "");
      return [k, numeric.has(k) ? v.replace(/[,\s₮]/g, "") : v];
    }),
  );
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { error: firstError(parsed.error), fields: fieldErrors(parsed.error) };
  const entries = Object.entries(parsed.data) as [keyof StoreSettings, string | number][];
  await prisma.$transaction(
    entries.map(([k, v]) =>
      prisma.setting.upsert({ where: { key: SETTING_KEYS[k] }, update: { value: String(v) }, create: { key: SETTING_KEYS[k], value: String(v) } }),
    ),
  );
  refreshStore();
  return { ok: true, message: "Тохиргоо хадгалагдлаа" };
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (next.length < 10) return { error: "Шинэ нууц үг 10-аас дээш тэмдэгт байна" };
  if (next !== confirm) return { error: "Шинэ нууц үг таарахгүй байна" };
  const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { error: "Одоогийн нууц үг буруу" };
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  return { ok: true, message: "Нууц үг солигдлоо" };
}
