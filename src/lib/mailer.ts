import "server-only";
import nodemailer from "nodemailer";
import { formatDateTime, formatMNT } from "./format";
import { PAYMENT_METHOD_LABEL } from "./constants";
import type { Order, OrderItem } from "@prisma/client";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function transporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendMail(opts: { to: string; subject: string; html: string; text: string }) {
  const t = transporter();
  if (!t) {
    console.info(`[mail] SMTP тохируулаагүй тул илгээсэнгүй → ${opts.to}: ${opts.subject}`);
    return false;
  }
  try {
    await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, ...opts });
    return true;
  } catch (e) {
    console.error("[mail] илгээхэд алдаа гарлаа", e);
    return false;
  }
}

function addressLine(o: Pick<Order, "district" | "khoroo" | "address">) {
  const khoroo = /^\d+$/.test(o.khoroo) ? `${o.khoroo}-р хороо` : o.khoroo;
  return `${o.district}, ${khoroo}, ${o.address}`;
}

export async function sendNewOrderEmail(order: Order & { items: OrderItem[] }, to: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${escapeHtml(i.productName)}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${formatMNT(i.lineTotal)}</td></tr>`,
    )
    .join("");
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;color:#111">
    <h2 style="margin:0 0 8px">Шинэ захиалга: ${escapeHtml(order.orderNumber)}</h2>
    <p style="margin:0 0 16px;color:#555">${formatDateTime(order.createdAt)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td><b>Нэр:</b></td><td>${escapeHtml(order.customerName)}</td></tr>
      <tr><td><b>Утас:</b></td><td>${escapeHtml(order.phone)}</td></tr>
      <tr><td><b>Хаяг:</b></td><td>${escapeHtml(addressLine(order))}</td></tr>
      <tr><td><b>Төлбөр:</b></td><td>${PAYMENT_METHOD_LABEL[order.paymentMethod]}</td></tr>
      ${order.note ? `<tr><td><b>Тайлбар:</b></td><td>${escapeHtml(order.note)}</td></tr>` : ""}
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
      <tr style="background:#f5f5f5"><th style="padding:6px 8px;text-align:left">Бараа</th><th style="padding:6px 8px">Тоо</th><th style="padding:6px 8px;text-align:right">Дүн</th></tr>
      ${rows}
      <tr><td colspan="2" style="padding:6px 8px;text-align:right">Барааны дүн</td><td style="padding:6px 8px;text-align:right">${formatMNT(order.subtotal)}</td></tr>
      <tr><td colspan="2" style="padding:6px 8px;text-align:right">Хүргэлт</td><td style="padding:6px 8px;text-align:right">${formatMNT(order.shippingFee)}</td></tr>
      <tr><td colspan="2" style="padding:6px 8px;text-align:right"><b>Нийт</b></td><td style="padding:6px 8px;text-align:right"><b>${formatMNT(order.total)}</b></td></tr>
    </table>
    ${site ? `<p style="margin-top:20px"><a href="${escapeHtml(site)}/admin/orders/${escapeHtml(order.id)}">Админ самбарт харах →</a></p>` : ""}
  </div>`;
  const text =
    `Шинэ захиалга ${order.orderNumber}\n${order.customerName}, ${order.phone}\n` +
    `${addressLine(order)}\n` +
    order.items.map((i) => `- ${i.productName} x${i.quantity} = ${formatMNT(i.lineTotal)}`).join("\n") +
    `\nНийт: ${formatMNT(order.total)} (${PAYMENT_METHOD_LABEL[order.paymentMethod]})`;
  return sendMail({ to, subject: `🛒 Шинэ захиалга ${order.orderNumber} — ${formatMNT(order.total)}`, html, text });
}
