import { z } from "zod";
import { DISTRICTS, MAX_CART_LINES, MAX_QTY_PER_ITEM } from "./constants";

// Удирдлагын болон үл үзэгдэх тэмдэгтийг хасаж, хоосон зайг цэгцэлнэ
const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028-\u202E]/g, "").trim();
const text = (min: number, max: number, msg: string) =>
  z.string({ required_error: msg }).transform(clean).pipe(z.string().min(min, msg).max(max, `${max} тэмдэгтээс ихгүй байна`));

export const phoneSchema = z
  .string({ required_error: "Утасны дугаараа оруулна уу" })
  .transform((s) => s.replace(/[\s-]/g, "").replace(/^\+?976/, ""))
  .pipe(z.string().regex(/^[6-9]\d{7}$/, "Утасны дугаар 8 оронтой байх ёстой (жишээ: 99112233)"));

export const orderNumberSchema = z
  .string({ required_error: "Захиалгын дугаараа оруулна уу" })
  .transform((s) => s.trim().toUpperCase())
  .pipe(z.string().regex(/^JD-\d{6}-\d{4,6}$/, "Захиалгын дугаар буруу байна (жишээ: JD-261019-4821)"));

export const cartItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(40),
      quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_ITEM),
    }),
  )
  .min(1, "Сагс хоосон байна")
  .max(MAX_CART_LINES);

export const checkoutSchema = z.object({
  customerName: text(2, 100, "Нэрээ оруулна уу"),
  phone: phoneSchema,
  district: z.enum(DISTRICTS, { errorMap: () => ({ message: "Дүүргээ сонгоно уу" }) }),
  khoroo: text(1, 60, "Хороогоо оруулна уу"),
  address: text(5, 500, "Дэлгэрэнгүй хаягаа оруулна уу (байр, орц, тоот)"),
  note: z.string().max(500, "500 тэмдэгтээс ихгүй байна").transform(clean).optional().default(""),
  paymentMethod: z.enum(["QPAY", "BANK_TRANSFER", "CASH_ON_DELIVERY"], {
    errorMap: () => ({ message: "Төлбөрийн хэлбэрээ сонгоно уу" }),
  }),
  items: cartItemsSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const trackSchema = z.object({ phone: phoneSchema, orderNumber: orderNumberSchema });

export const imageUrlSchema = z
  .string()
  .max(1000)
  .refine((u) => /^\/(uploads|images)\/[\w\-./]+$/.test(u) || /^https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\/[\w\-./%]+$/.test(u), {
    message: "Зургийн холбоос буруу байна",
  })
  .refine((u) => !u.includes(".."), { message: "Зургийн холбоос буруу байна" });

const intField = (msg: string) =>
  z.preprocess((v) => (typeof v === "string" ? v.replace(/[,\s₮]/g, "") : v), z.coerce.number({ invalid_type_error: msg }).int(msg).min(0, msg).max(1_000_000_000, msg));

export const productSchema = z
  .object({
    name: text(2, 200, "Барааны нэрийг оруулна уу"),
    slug: z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .pipe(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug зөвхөн латин жижиг үсэг, тоо, зураас байна").max(100))
      .optional()
      .or(z.literal("")),
    description: text(1, 10000, "Тайлбар оруулна уу"),
    price: intField("Үнэ зөв тоо байх ёстой"),
    salePrice: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), intField("Хямдралын үнэ зөв тоо байх ёстой").nullable()),
    stock: intField("Үлдэгдэл зөв тоо байх ёстой"),
    categoryId: z.string().min(1, "Ангилал сонгоно уу"),
    isFeatured: z.boolean(),
    isActive: z.boolean(),
    images: z.array(imageUrlSchema).max(10, "Хамгийн ихдээ 10 зураг"),
  })
  .refine((d) => d.price > 0, { message: "Үнэ 0-ээс их байна", path: ["price"] })
  .refine((d) => d.salePrice === null || d.salePrice < d.price, {
    message: "Хямдралын үнэ үндсэн үнээс бага байх ёстой",
    path: ["salePrice"],
  });

export const categorySchema = z.object({
  name: text(2, 100, "Ангиллын нэрийг оруулна уу"),
  slug: z.string().transform((s) => s.trim().toLowerCase()).pipe(z.string().regex(/^([a-z0-9]+(?:-[a-z0-9]+)*)?$/, "Slug буруу")).optional(),
  description: z.string().max(500).transform(clean).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const bannerSchema = z.object({
  title: text(1, 120, "Гарчиг оруулна уу"),
  subtitle: z.string().max(240).transform(clean).optional(),
  imageUrl: imageUrlSchema,
  linkUrl: z
    .string()
    .trim()
    .max(300)
    .refine((u) => u === "" || /^\/[\w\-./?=&%]*$/.test(u) || /^https:\/\/[^\s"'<>]+$/.test(u), "Холбоос / эсвэл https:// -ээр эхэлнэ")
    .optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean(),
});

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Оролт буруу байна";
}

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join(".") || "_";
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
