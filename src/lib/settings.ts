import "server-only";
import { cache } from "react";
import { prisma } from "./db";

export type StoreSettings = {
  contactPhone: string;
  contactEmail: string;
  facebookUrl: string;
  facebookName: string;
  address: string;
  workingHours: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  bankIban: string;
  shippingFeeUB: number;
  shippingFeeRural: number;
  freeShippingThreshold: number;
  notifyEmail: string;
};

export const SETTING_KEYS = {
  contactPhone: "contact_phone",
  contactEmail: "contact_email",
  facebookUrl: "facebook_url",
  facebookName: "facebook_name",
  address: "address",
  workingHours: "working_hours",
  bankName: "bank_name",
  bankAccount: "bank_account",
  bankHolder: "bank_holder",
  bankIban: "bank_iban",
  shippingFeeUB: "shipping_fee_ub",
  shippingFeeRural: "shipping_fee_rural",
  freeShippingThreshold: "free_shipping_threshold",
  notifyEmail: "notify_email",
} as const satisfies Record<keyof StoreSettings, string>;

export function defaultSettings(): StoreSettings {
  return {
    contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "95209563",
    contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "lutaajamsran@gmail.com",
    facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/",
    facebookName: "JDstore онлайн дэлгүүр",
    address: "Улаанбаатар хот",
    workingHours: "Даваа–Ням 10:00–20:00",
    bankName: "Хаан банк",
    bankAccount: "0000000000",
    bankHolder: "JDstore",
    bankIban: "",
    shippingFeeUB: 5000,
    shippingFeeRural: 10000,
    freeShippingThreshold: 100000,
    notifyEmail: process.env.ORDER_NOTIFY_EMAIL || "lutaajamsran@gmail.com",
  };
}

const NUMERIC: (keyof StoreSettings)[] = ["shippingFeeUB", "shippingFeeRural", "freeShippingThreshold"];

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const base = defaultSettings();
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.setting.findMany();
  } catch (e) {
    console.error("[settings] DB уншиж чадсангүй, анхны утгыг ашиглав", e);
    return base;
  }
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const out = { ...base } as Record<keyof StoreSettings, string | number>;
  for (const [field, key] of Object.entries(SETTING_KEYS) as [keyof StoreSettings, string][]) {
    const v = byKey.get(key);
    if (v === undefined || v === "") continue;
    if (NUMERIC.includes(field)) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) out[field] = Math.round(n);
    } else {
      out[field] = v;
    }
  }
  return out as StoreSettings;
});
