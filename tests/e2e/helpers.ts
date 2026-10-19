import { expect, type Page } from "@playwright/test";

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "lutaajamsran@gmail.com";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("И-мэйл").fill(ADMIN_EMAIL);
  await page.getByLabel("Нууц үг").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Нэвтрэх" }).click();
  await expect(page.getByRole("heading", { name: "Хяналтын самбар" })).toBeVisible();
}

export async function fillCheckout(page: Page, opts: { phone: string; method: "QPay" | "Дансаар шилжүүлэх" | "Хүргэлтээр бэлнээр" }) {
  await page.getByLabel("Нэр *").fill("Туршилт Бат");
  await page.getByLabel("Утасны дугаар *").fill(opts.phone);
  await page.getByLabel("Дүүрэг *").selectOption("Сүхбаатар");
  await page.getByLabel("Хороо *").fill("8");
  await page.getByLabel("Дэлгэрэнгүй хаяг *").fill("Сөүлийн гудамж, 12-р байр, 3 орц, 45 тоот");
  await page.getByRole("radio", { name: new RegExp(`^${opts.method}`) }).check();
}
