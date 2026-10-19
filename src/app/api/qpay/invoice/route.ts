import { findOrderWithToken } from "@/lib/order-access";
import { getOrCreateQPayInvoice, OrderError } from "@/lib/orders";
import { qpayMode } from "@/lib/qpay";
import { error, json, limit, readJson } from "@/lib/http";

export async function POST(req: Request) {
  const limited = await limit("qpay-invoice", 20, 10 * 60_000);
  if (limited) return limited;
  let body: { orderNumber?: unknown; token?: unknown };
  try {
    body = (await readJson(req, 2_000)) as typeof body;
  } catch {
    return error("Хүсэлт буруу байна");
  }
  const order = await findOrderWithToken(body.orderNumber, body.token);
  if (!order) return error("Захиалга олдсонгүй", 404);
  if (order.status !== "PENDING") return json({ status: order.status });

  try {
    const p = await getOrCreateQPayInvoice(order.id);
    return json({
      status: order.status,
      mode: qpayMode(),
      amount: p.amount,
      qrImage: p.qrImage,
      qrText: p.qrText,
      shortUrl: p.shortUrl,
      deeplinks: p.deeplinks ?? [],
    });
  } catch (e) {
    if (e instanceof OrderError) return error(e.message, 409);
    console.error("[qpay] invoice үүсгэхэд алдаа", e);
    return error("QPay нэхэмжлэх үүсгэж чадсангүй. Түр хүлээгээд дахин оролдоно уу эсвэл өөр төлбөрийн хэлбэр сонгоно уу.", 502);
  }
}
