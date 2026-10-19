import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { expireStaleQPayOrders } from "@/lib/orders";
import { error, json } from "@/lib/http";

/** Vercel Cron (vercel.json) өдөрт нэг удаа дуудна. Authorization: Bearer CRON_SECRET */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (!secret || got.length !== want.length || !timingSafeEqual(got, want)) return error("Unauthorized", 401);
  const hours = Number(process.env.QPAY_ORDER_EXPIRE_HOURS || 24);
  const result = await expireStaleQPayOrders(Number.isFinite(hours) && hours > 0 ? hours : 24);
  if (result.cancelled > 0) revalidatePath("/", "layout");
  return json(result);
}
