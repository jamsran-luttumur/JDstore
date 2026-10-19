import type { OrderStatus, PaymentMethod } from "@prisma/client";

export const SITE_NAME = "JDstore";

export const UB_DISTRICTS = [
  "Баянгол",
  "Баянзүрх",
  "Сонгинохайрхан",
  "Сүхбаатар",
  "Хан-Уул",
  "Чингэлтэй",
  "Налайх",
  "Багануур",
  "Багахангай",
] as const;

export const RURAL_DISTRICT = "Орон нутаг";
export const DISTRICTS = [...UB_DISTRICTS, RURAL_DISTRICT] as const;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Хүлээгдэж буй",
  PAID: "Төлөгдсөн",
  SHIPPING: "Хүргэлтэд",
  DELIVERED: "Хүргэгдсэн",
  CANCELLED: "Цуцлагдсан",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  SHIPPING: "bg-sky-100 text-sky-800",
  DELIVERED: "bg-teal-100 text-teal-900",
  CANCELLED: "bg-rose-100 text-rose-800",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  QPAY: "QPay",
  BANK_TRANSFER: "Дансаар шилжүүлэх",
  CASH_ON_DELIVERY: "Хүргэлтээр бэлнээр",
};

export const SORT_OPTIONS = [
  { value: "new", label: "Шинэ нь эхэндээ" },
  { value: "popular", label: "Их зарагдсан" },
  { value: "price_asc", label: "Үнэ: багаас их" },
  { value: "price_desc", label: "Үнэ: ихээс бага" },
  { value: "discount", label: "Хямдрал ихтэй" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const MAX_QTY_PER_ITEM = 50;
export const MAX_CART_LINES = 50;
