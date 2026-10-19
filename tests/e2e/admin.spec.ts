import path from "path";
import { expect, test } from "@playwright/test";
import { adminLogin, fillCheckout } from "./helpers";

test.describe("Админ", () => {
  test("нэвтрэлтгүй хандалт хаагдана", async ({ page, request }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/login$/);
    const up = await request.post("/api/admin/upload");
    expect(up.status()).toBe(401);
  });

  test("буруу нууц үг", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("И-мэйл").fill("lutaajamsran@gmail.com");
    await page.getByLabel("Нууц үг").fill("wrong-password");
    await page.getByRole("button", { name: "Нэвтрэх" }).click();
    await expect(page.getByText("И-мэйл эсвэл нууц үг буруу байна")).toBeVisible();
  });

  test("бараа нэмэх (зураг upload) → дэлгүүрт харагдах → устгах", async ({ page }) => {
    await adminLogin(page);
    await page.getByRole("navigation", { name: "Админ цэс" }).getByRole("link", { name: "Бараа" }).click();
    await page.getByRole("link", { name: "+ Шинэ бараа" }).click();
    const name = `Туршилтын аяга ${Date.now()}`;
    await page.getByLabel("Нэр *").fill(name);
    await page.getByLabel("Тайлбар *").fill("Керамик аяга, 350 мл.\n\n• Бичил долгионы зууханд хэрэглэж болно");
    await page.getByLabel("Үнэ (₮) *").fill("25,000");
    await page.getByLabel("Хямдралын үнэ (₮)").fill("19900");
    await page.getByLabel("Үлдэгдэл *").fill("7");
    await page.getByLabel("Ангилал *").selectOption({ label: "Гэр ахуй" });
    await page.getByLabel("Онцлох бараа (нүүр хуудсанд)").check();
    await page.locator('input[type="file"]').setInputFiles([path.join(__dirname, "../fixtures/sample.jpg"), path.join(__dirname, "../fixtures/sample.webp")]);
    await expect(page.locator("li img")).toHaveCount(2, { timeout: 20_000 });
    await page.getByRole("button", { name: "Хадгалах" }).click();
    await expect(page.getByText("Бараа хадгалагдлаа.")).toBeVisible();
    await expect(page.getByRole("link", { name })).toBeVisible();

    // Дэлгүүрт харагдах
    await page.goto(`/products?q=${encodeURIComponent(name)}`);
    await expect(page.locator("article")).toHaveCount(1);
    await expect(page.locator("article")).toContainText("19,900₮");
    await page.locator("article a").first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(page.getByRole("tab")).toHaveCount(2);

    // Хямдралын үнэ > үнэ байвал алдаа
    await page.goto("/admin/products");
    await page.getByRole("link", { name }).click();
    await page.getByLabel("Хямдралын үнэ (₮)").fill("30000");
    await page.getByRole("button", { name: "Хадгалах" }).click();
    await expect(page.getByText("Хямдралын үнэ үндсэн үнээс бага байх ёстой").first()).toBeVisible();

    // Устгах
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Бараа устгах" }).click();
    await expect(page.getByText("Бараа устгагдлаа.")).toBeVisible();
  });

  test("захиалгын төлөв солих, цуцлахад үлдэгдэл буцах, тайлан", async ({ page }) => {
    // Бэлнээр төлөх захиалга үүсгэх
    await page.goto("/products/hair-dryer-2000w");
    const stockText = await page.getByText(/Үлдэгдэл: \d+ ширхэг/).textContent();
    const before = Number(stockText!.match(/(\d+) ширхэг/)![1]);
    await page.getByRole("button", { name: "Сагсанд нэмэх", exact: true }).click();
    await page.goto("/checkout");
    await fillCheckout(page, { phone: "95001122", method: "Хүргэлтээр бэлнээр" });
    await page.getByRole("button", { name: "Захиалга баталгаажуулах" }).click();
    const orderNumber = (await page.getByTestId("order-number").textContent())!.trim();

    await adminLogin(page);
    await page.goto(`/admin/orders?q=${orderNumber}`);
    await page.getByRole("link", { name: orderNumber }).click();
    await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible();

    await page.getByLabel("Төлөв өөрчлөх").selectOption("SHIPPING");
    await page.getByRole("button", { name: "Хадгалах" }).click();
    await expect(page.getByText("Төлөв шинэчлэгдлээ")).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByLabel("Төлөв өөрчлөх").selectOption("CANCELLED");
    await page.getByRole("button", { name: "Хадгалах" }).click();
    await expect(page.getByText("Төлөв шинэчлэгдлээ")).toBeVisible();

    // Үлдэгдэл буцсан эсэх (админ барааны жагсаалтаас)
    await page.goto("/admin/products?q=Үс хатаагч");
    await expect(page.locator("tbody tr").first().locator("td").nth(3)).toHaveText(String(before));

    // Шүүлт ба тайлан
    await page.goto("/admin/orders?status=CANCELLED");
    await expect(page.getByRole("link", { name: orderNumber })).toBeVisible();
    await page.goto("/admin");
    await expect(page.getByText("Өдрийн борлуулалт (30 хоног)")).toBeVisible();
    await expect(page.getByText("Сарын борлуулалт (12 сар)")).toBeVisible();
  });

  test("ангилал, баннер, тохиргоо", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/categories");
    const first = page.locator(".card").first();
    const cname = `Тест ангилал ${Date.now() % 100000}`;
    await first.locator('input[name="name"]').fill(cname);
    await first.getByRole("button", { name: "Нэмэх" }).click();
    await expect(page.locator(`input[value="${cname}"]`)).toHaveCount(1);
    const row = page.locator(".card", { has: page.locator(`input[value="${cname}"]`) });
    page.once("dialog", (d) => d.accept());
    await row.getByRole("button", { name: "Устгах" }).click();
    await expect(page.locator(`input[value="${cname}"]`)).toHaveCount(0);

    await page.goto("/admin/banners");
    await expect(page.getByRole("heading", { name: "Нүүр хуудасны баннер" })).toBeVisible();

    await page.goto("/admin/settings");
    await page.getByLabel("Дансны дугаар").fill("5012345678");
    await page.getByRole("button", { name: "Хадгалах" }).first().click();
    await expect(page.getByText("Тохиргоо хадгалагдлаа")).toBeVisible();
    await page.getByLabel("Facebook холбоос").fill("javascript:alert(1)");
    await page.getByRole("button", { name: "Хадгалах" }).first().click();
    await expect(page.getByText(/Facebook холбоос буруу|https/).first()).toBeVisible();
  });
});
