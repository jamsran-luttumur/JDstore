import { expect, test } from "@playwright/test";

test("утсан дээр цэс, хайлт, сагс ажиллана", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: "Цэс нээх" }).click();
  await page.getByRole("dialog", { name: "Цэс" }).getByRole("link", { name: "Гоо сайхан" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Гоо сайхан" })).toBeVisible();
  await page.locator("article").first().getByRole("button").click();
  await page.getByRole("link", { name: /Сагс, 1 бараа/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Сагс" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Захиалах" })).toBeVisible();
});
