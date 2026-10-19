import { prisma } from "@/lib/db";
import { error, json, limit, readJson } from "@/lib/http";
import { trackSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const limited = await limit("track", 15, 5 * 60_000);
  if (limited) return limited;
  let body: unknown;
  try {
    body = await readJson(req, 4_000);
  } catch {
    return error("Хүсэлт буруу байна");
  }
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Мэдээлэл буруу", 422);

  const order = await prisma.order.findFirst({
    where: { orderNumber: parsed.data.orderNumber, phone: parsed.data.phone },
    select: {
      orderNumber: true,
      status: true,
      paymentMethod: true,
      subtotal: true,
      shippingFee: true,
      total: true,
      district: true,
      createdAt: true,
      paidAt: true,
      updatedAt: true,
      items: { select: { productName: true, quantity: true, unitPrice: true, lineTotal: true } },
    },
  });
  // Аль талбар буруу байгааг илчлэхгүй
  if (!order) return error("Захиалга олдсонгүй. Утас болон захиалгын дугаараа шалгана уу.", 404);
  return json({ order });
}
