import "server-only";
import { prisma } from "./db";
import { verifyOrderAccessToken } from "./tokens";
import { orderNumberSchema } from "./validation";

/** Захиалгын дугаар + HMAC токеноор захиалгыг авна. Буруу бол null. */
export async function findOrderWithToken(orderNumber: unknown, token: unknown) {
  const num = orderNumberSchema.safeParse(orderNumber);
  if (!num.success || typeof token !== "string") return null;
  if (!verifyOrderAccessToken(num.data, token)) return null;
  return prisma.order.findUnique({ where: { orderNumber: num.data } });
}
