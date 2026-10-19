import "server-only";
import { prisma } from "./db";

export type SalesRow = { period: string; orders: number; revenue: number };

// Борлуулалтад тооцох төлөвүүд (төлөгдсөн болон түүнээс хойших)
const SOLD = ["PAID", "SHIPPING", "DELIVERED"];

export async function dailySales(days = 30): Promise<SalesRow[]> {
  const rows = await prisma.$queryRaw<{ period: string; orders: number; revenue: bigint }[]>`
    SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ulaanbaatar', 'YYYY-MM-DD') AS period,
           count(*)::int AS orders, coalesce(sum(total), 0)::bigint AS revenue
    FROM "Order"
    WHERE status::text = ANY(${SOLD}) AND "createdAt" >= now() - make_interval(days => ${days}::int)
    GROUP BY 1 ORDER BY 1 DESC`;
  return rows.map((r) => ({ period: r.period, orders: r.orders, revenue: Number(r.revenue) }));
}

export async function monthlySales(months = 12): Promise<SalesRow[]> {
  const rows = await prisma.$queryRaw<{ period: string; orders: number; revenue: bigint }[]>`
    SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ulaanbaatar', 'YYYY-MM') AS period,
           count(*)::int AS orders, coalesce(sum(total), 0)::bigint AS revenue
    FROM "Order"
    WHERE status::text = ANY(${SOLD}) AND "createdAt" >= date_trunc('month', now()) - make_interval(months => ${months - 1}::int)
    GROUP BY 1 ORDER BY 1 DESC`;
  return rows.map((r) => ({ period: r.period, orders: r.orders, revenue: Number(r.revenue) }));
}

export async function topProducts(limit = 5) {
  const rows = await prisma.$queryRaw<{ name: string; qty: bigint; revenue: bigint }[]>`
    SELECT i."productName" AS name, sum(i.quantity)::bigint AS qty, sum(i."lineTotal")::bigint AS revenue
    FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId"
    WHERE o.status::text = ANY(${SOLD}) AND o."createdAt" >= now() - interval '30 days'
    GROUP BY 1 ORDER BY 2 DESC LIMIT ${limit}::int`;
  return rows.map((r) => ({ name: r.name, qty: Number(r.qty), revenue: Number(r.revenue) }));
}
