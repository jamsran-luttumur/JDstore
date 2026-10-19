import { prisma } from "@/lib/db";
import { findOrderWithToken } from "@/lib/order-access";
import { mockMarkPaid, qpayMode } from "@/lib/qpay";
import { error, json, readJson } from "@/lib/http";

/** ЗӨВХӨН QPAY_MODE=mock үед: банкны апп-аар төлснийг дуурайна. Дараа нь жинхэнэ шалгалтын урсгал ажиллана. */
export async function POST(req: Request) {
  if (qpayMode() !== "mock") return error("Not found", 404);
  let body: { orderNumber?: unknown; token?: unknown };
  try {
    body = (await readJson(req, 2_000)) as typeof body;
  } catch {
    return error("Хүсэлт буруу байна");
  }
  const order = await findOrderWithToken(body.orderNumber, body.token);
  if (!order) return error("Захиалга олдсонгүй", 404);
  const payment = await prisma.payment.findFirst({ where: { orderId: order.id, status: "NEW" }, orderBy: { createdAt: "desc" } });
  if (!payment || !mockMarkPaid(payment.invoiceId)) return error("Нэхэмжлэх олдсонгүй", 404);
  return json({ ok: true });
}
