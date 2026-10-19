import { prisma } from "@/lib/db";
import { verifyQPayPayment } from "@/lib/orders";

/**
 * QPay төлбөр төлөгдөхөд энэ URL-ийг дуудна: /api/qpay/callback?token=...
 * Callback-ийн агуулгад итгэхгүй — токеноор invoice-ийг олж, QPay API-аас дахин шалгана.
 */
async function handle(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token || token.length > 100) return new Response("BAD_REQUEST", { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { callbackToken: token }, select: { id: true } });
  if (!payment) return new Response("NOT_FOUND", { status: 404 });

  try {
    await verifyQPayPayment(payment.id);
  } catch (e) {
    console.error("[qpay] callback шалгалтын алдаа", e);
    return new Response("ERROR", { status: 500 }); // QPay дахин оролдоно
  }
  return new Response("SUCCESS", { status: 200 });
}

export const GET = handle;
export const POST = handle;
