import { after } from "next/server";
import { createOrder, OrderError } from "@/lib/orders";
import { sendNewOrderEmail } from "@/lib/mailer";
import { getSettings } from "@/lib/settings";
import { orderAccessToken } from "@/lib/tokens";
import { error, json, limit, readJson } from "@/lib/http";
import { checkoutSchema, fieldErrors } from "@/lib/validation";

export async function POST(req: Request) {
  const limited = await limit("order", 10, 10 * 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return error("Хүсэлт буруу байна");
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return error("Мэдээллээ шалгана уу", 422, { fields: fieldErrors(parsed.error) });
  }

  if (parsed.data.paymentMethod === "QPAY" && process.env.QPAY_ENABLED === "false") {
    return error("QPay төлбөр одоогоор боломжгүй байна. Өөр төлбөрийн хэлбэр сонгоно уу.", 422);
  }

  try {
    const order = await createOrder(parsed.data);
    after(async () => {
      const s = await getSettings();
      await sendNewOrderEmail(order, s.notifyEmail);
    });
    return json({ orderNumber: order.orderNumber, token: orderAccessToken(order.orderNumber) }, 201);
  } catch (e) {
    if (e instanceof OrderError) return error(e.message, 409, { code: e.code });
    console.error("[orders] захиалга үүсгэхэд алдаа", e);
    return error("Захиалга бүртгэхэд алдаа гарлаа. Дахин оролдоно уу.", 500);
  }
}
