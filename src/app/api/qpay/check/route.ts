import { prisma } from "@/lib/db";
import { findOrderWithToken } from "@/lib/order-access";
import { verifyQPayPayment } from "@/lib/orders";
import { error, json, limit, readJson } from "@/lib/http";

/** Хэрэглэгчийн хуудас төлбөрийн төлөвийг шалгах (QPay API-аар дахин баталгаажуулна) */
export async function POST(req: Request) {
  const limited = await limit("qpay-check", 40, 60_000);
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

  const payment = await prisma.payment.findFirst({ where: { orderId: order.id, status: "NEW" }, orderBy: { createdAt: "desc" } });
  if (!payment) return json({ status: order.status });
  try {
    const { paid } = await verifyQPayPayment(payment.id);
    if (!paid) return json({ status: "PENDING" });
  } catch (e) {
    console.error("[qpay] check алдаа", e);
    return json({ status: "PENDING" });
  }
  const fresh = await prisma.order.findUnique({ where: { id: order.id }, select: { status: true } });
  return json({ status: fresh?.status ?? "PENDING" });
}
