import "server-only";
import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "./db";
import { buildQuote, normalizeItems } from "./pricing";
import { getSettings } from "./settings";
import { randomDigits, randomToken } from "./tokens";
import { ubDateStamp } from "./format";
import { SITE_URL } from "./site";
import { cancelInvoice, checkInvoice, createInvoice } from "./qpay";
import type { CheckoutInput } from "./validation";

export class OrderError extends Error {
  constructor(message: string, public code: string = "order_error") {
    super(message);
  }
}

function newOrderNumber(attempt: number) {
  return `JD-${ubDateStamp()}-${randomDigits(attempt < 3 ? 4 : 6)}`;
}

function isUniqueViolation(e: unknown, field?: string) {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  if (!field) return true;
  const target = (e.meta?.target ?? []) as string[] | string;
  return Array.isArray(target) ? target.includes(field) : String(target).includes(field);
}

/**
 * Захиалга үүсгэнэ. Дүнг ЗӨВХӨН DB-ээс тооцож, үлдэгдлийг нөхцөлтэйгөөр (stock >= q) хасна.
 * Аль нэг бараа хүрэлцэхгүй бол бүх transaction буцаана.
 */
export async function createOrder(input: CheckoutInput) {
  const settings = await getSettings();
  const items = normalizeItems(input.items);

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const quote = await buildQuote(items, input.district, settings, tx);
          const bad = quote.lines.find((l) => !l.available);
          if (bad) {
            throw new OrderError(
              bad.problem === "not_found"
                ? "Сагсанд байгаа зарим бараа худалдаанаас гарсан байна. Сагсаа шинэчилнэ үү."
                : bad.problem === "out_of_stock"
                  ? `"${bad.name}" бараа дууссан байна.`
                  : `"${bad.name}" барааны үлдэгдэл ${bad.stock} ширхэг байна.`,
              "stock",
            );
          }

          // Deadlock-оос сэргийлж ID-гаар эрэмбэлж хасна
          for (const line of [...quote.lines].sort((a, b) => a.productId.localeCompare(b.productId))) {
            const r = await tx.product.updateMany({
              where: { id: line.productId, isActive: true, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity }, soldCount: { increment: line.quantity } },
            });
            if (r.count !== 1) throw new OrderError(`"${line.name}" барааны үлдэгдэл хүрэлцэхгүй байна.`, "stock");
          }

          return tx.order.create({
            data: {
              orderNumber: newOrderNumber(attempt),
              customerName: input.customerName,
              phone: input.phone,
              district: input.district,
              khoroo: input.khoroo,
              address: input.address,
              note: input.note || null,
              paymentMethod: input.paymentMethod,
              subtotal: quote.subtotal,
              shippingFee: quote.shippingFee,
              total: quote.total,
              items: {
                create: quote.lines.map((l) => ({
                  productId: l.productId,
                  productName: l.name,
                  unitPrice: l.unitPrice,
                  quantity: l.quantity,
                  lineTotal: l.lineTotal,
                })),
              },
            },
            include: { items: true },
          });
        },
        { timeout: 15_000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      );
    } catch (e) {
      if (isUniqueViolation(e, "orderNumber")) continue;
      throw e;
    }
  }
  throw new OrderError("Захиалгын дугаар үүсгэж чадсангүй, дахин оролдоно уу.");
}

async function lockOrder(tx: Prisma.TransactionClient, orderId: string) {
  await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
  return tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
}

/** Админ төлөв солих. Цуцлахад үлдэгдлийг буцааж, цуцлалтаас сэргээхэд дахин хасна. */
export async function changeOrderStatus(orderId: string, next: OrderStatus) {
  const cancelledInvoices: string[] = [];
  const result = await prisma.$transaction(
    async (tx) => {
      const order = await lockOrder(tx, orderId);
      if (!order) throw new OrderError("Захиалга олдсонгүй");
      if (order.status === next) return order;

      if (next === "CANCELLED") {
        for (const it of order.items) {
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { increment: it.quantity }, soldCount: { decrement: it.quantity } },
          });
        }
        const open = await tx.payment.findMany({ where: { orderId, status: "NEW" } });
        cancelledInvoices.push(...open.map((p) => p.invoiceId));
        await tx.payment.updateMany({ where: { orderId, status: "NEW" }, data: { status: "CANCELLED" } });
      } else if (order.status === "CANCELLED") {
        for (const it of order.items) {
          const r = await tx.product.updateMany({
            where: { id: it.productId, stock: { gte: it.quantity } },
            data: { stock: { decrement: it.quantity }, soldCount: { increment: it.quantity } },
          });
          if (r.count !== 1) throw new OrderError(`"${it.productName}" барааны үлдэгдэл хүрэлцэхгүй тул сэргээх боломжгүй`);
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: next,
          paidAt: next === "PAID" && !order.paidAt ? new Date() : undefined,
        },
        include: { items: true },
      });
    },
    { timeout: 15_000 },
  );
  for (const id of cancelledInvoices) await cancelInvoice(id).catch(() => undefined);
  return result;
}

const INVOICE_REUSE_MS = 20 * 60 * 60 * 1000;

/**
 * Захиалгад QPay invoice авна. Order мөрийг түгжиж байгаа тул зэрэг ирсэн хүсэлтүүд
 * давхар invoice үүсгэхгүй.
 */
export async function getOrCreateQPayInvoice(orderId: string) {
  return prisma.$transaction(
    async (tx) => {
      const order = await lockOrder(tx, orderId);
      if (!order) throw new OrderError("Захиалга олдсонгүй");
      if (order.paymentMethod !== "QPAY") throw new OrderError("Энэ захиалга QPay-ээр төлөгдөхгүй");
      if (order.status !== "PENDING") throw new OrderError("Энэ захиалга төлбөр хүлээгээгүй байна", "not_pending");

      const existing = await tx.payment.findFirst({
        where: { orderId, status: "NEW", amount: order.total },
        orderBy: { createdAt: "desc" },
      });
      if (existing && Date.now() - existing.createdAt.getTime() < INVOICE_REUSE_MS) return existing;

      const prev = await tx.payment.count({ where: { orderId } });
      const callbackToken = randomToken(24);
      const inv = await createInvoice({
        senderInvoiceNo: prev === 0 ? order.orderNumber : `${order.orderNumber}-${prev + 1}`,
        amount: order.total,
        description: `JDstore захиалга ${order.orderNumber}`,
        callbackUrl: `${SITE_URL}/api/qpay/callback?token=${callbackToken}`,
        receiverPhone: order.phone,
      });
      if (existing) await tx.payment.update({ where: { id: existing.id }, data: { status: "CANCELLED" } });
      return tx.payment.create({
        data: {
          orderId,
          invoiceId: inv.invoiceId,
          amount: order.total,
          callbackToken,
          qrText: inv.qrText,
          qrImage: inv.qrImage,
          shortUrl: inv.shortUrl,
          deeplinks: inv.urls as unknown as Prisma.InputJsonValue,
        },
      });
    },
    { timeout: 40_000, maxWait: 10_000 },
  );
}

/**
 * Төлбөрийг QPay API-аар дахин шалгаж, бүрэн төлөгдсөн бол л "төлөгдсөн" болгоно.
 * Атомар нөхцөлт update (status = NEW / PENDING) нь давхар бүртгэлээс сэргийлнэ.
 */
export async function verifyQPayPayment(paymentId: string): Promise<{ paid: boolean }> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { paid: false };
  if (payment.status === "PAID") return { paid: true };

  const check = await checkInvoice(payment.invoiceId);
  const paidRows = check.rows.filter((r) => String(r.payment_status).toUpperCase() === "PAID");
  const paidSum = paidRows.reduce((s, r) => s + Number(r.payment_amount || 0), 0);
  if (paidRows.length === 0 || paidSum < payment.amount) return { paid: false };

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const p = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: {
        status: "PAID",
        qpayPaymentId: String(paidRows[0].payment_id),
        paidAmount: paidSum,
        paidAt: now,
        rawCheck: check.raw as Prisma.InputJsonValue,
      },
    });
    if (p.count !== 1) return; // өөр хүсэлт аль хэдийн бүртгэсэн
    const o = await tx.order.updateMany({
      where: { id: payment.orderId, status: "PENDING" },
      data: { status: "PAID", paidAt: now },
    });
    if (o.count !== 1) {
      console.warn(`[qpay] ${payment.orderId} захиалга PENDING биш үед төлбөр орлоо — шалгаж буцаан олголт хийнэ үү`);
    }
  });
  return { paid: true };
}

/**
 * Удаан хугацаанд төлөгдөөгүй QPay захиалгыг цуцалж үлдэгдлийг суллана.
 * Цуцлахаас өмнө QPay-ээс сүүлийн удаа шалгана (төлсөн бол "төлөгдсөн" болно).
 */
export async function expireStaleQPayOrders(maxAgeHours = 24) {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { paymentMethod: "QPAY", status: "PENDING", createdAt: { lt: cutoff } },
    select: { id: true, payments: { where: { status: "NEW" }, select: { id: true } } },
    take: 100,
  });
  let cancelled = 0;
  let paid = 0;
  for (const o of stale) {
    let isPaid = false;
    for (const p of o.payments) {
      try {
        if ((await verifyQPayPayment(p.id)).paid) isPaid = true;
      } catch (e) {
        console.error("[expire] шалгалтын алдаа", e);
        isPaid = true; // эргэлзээтэй үед цуцлахгүй
      }
    }
    if (isPaid) {
      paid++;
      continue;
    }
    await changeOrderStatus(o.id, "CANCELLED");
    cancelled++;
  }
  return { checked: stale.length, cancelled, paid };
}
