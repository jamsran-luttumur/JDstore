import { expect, test } from "@playwright/test";
import { fillCheckout } from "./helpers";

test.describe("Дэлгүүр", () => {
  test("нүүр хуудас, ангилал, хайлт, шүүлт", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/JDstore/);
    await expect(page.getByRole("heading", { name: "Онцлох бараа" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Бестселлер" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Хямдралтай бараа" })).toBeVisible();
    await expect(page.locator('a[href="tel:95209563"]').first()).toBeVisible();

    await page.getByRole("navigation", { name: "Ангилал" }).getByRole("link", { name: "Электроник" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Электроник" })).toBeVisible();
    await expect(page.locator("article")).toHaveCount(3);

    await page.locator("#site-search").fill("данх");
    await page.locator("#site-search").press("Enter");
    await expect(page).toHaveURL(/q=/);
    await expect(page.locator("article")).toHaveCount(1);
    await expect(page.locator("article").first()).toContainText("Цахилгаан данх");

    await page.goto("/products?sort=price_asc");
    // Бодит (хямдарсан) үнээр өсөхөөр эрэмбэлэгдсэн эсэх
    const prices = await page.locator("article").evaluateAll((els) =>
      els.map((el) => Number((el.querySelector("[data-testid=price]")?.textContent ?? "0").replace(/\D/g, ""))),
    );
    expect(prices.length).toBeGreaterThan(5);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    await page.goto("/products?min=100000");
    const filtered = await page.locator("article").evaluateAll((els) =>
      els.map((el) => Number((el.querySelector("[data-testid=price]")?.textContent ?? "0").replace(/\D/g, ""))),
    );
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((p) => p >= 100000)).toBe(true);
  });

  test("бараа → сагс → QPay захиалга → төлбөр баталгаажих", async ({ page }) => {
    await page.goto("/products/jd-buds-pro");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Утасгүй чихэвч JD Buds Pro");
    await expect(page.getByText(/Үлдэгдэл: \d+ ширхэг/)).toBeVisible();
    await page.getByRole("tab", { name: "2-р зураг" }).click();
    await page.getByLabel("Нэмэх", { exact: true }).click();
    await page.getByRole("button", { name: "Сагсанд нэмэх", exact: true }).click();
    await expect(page.getByText("сагсанд нэмэгдлээ")).toBeVisible();

    await page.goto("/products/power-bank-20000");
    await page.getByRole("button", { name: "Шууд авах" }).click();
    await expect(page).toHaveURL(/\/cart$/);

    // 2 × 69,000 + 1 × 59,000 = 197,000 → 100,000-аас дээш тул хүргэлт үнэгүй
    await expect(page.getByText("197,000₮").first()).toBeVisible();
    await expect(page.getByText("Үнэгүй", { exact: true })).toBeVisible();
    await page.getByLabel("Зөөврийн цэнэглэгч 20000mAh хасах").click();
    await expect(page.getByText("138,000₮").first()).toBeVisible();

    await page.getByRole("link", { name: "Захиалах" }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    // Оролтын шалгалт
    await page.getByRole("button", { name: "Захиалга баталгаажуулах" }).click();
    await expect(page.getByText("Утасны дугаар 8 оронтой байх ёстой")).toBeVisible();

    await fillCheckout(page, { phone: "88001122", method: "QPay" });
    await page.getByRole("button", { name: "Захиалга баталгаажуулах" }).click();
    await expect(page.getByRole("heading", { name: "Захиалга амжилттай бүртгэгдлээ!" })).toBeVisible();
    const orderNumber = (await page.getByTestId("order-number").textContent())!.trim();
    expect(orderNumber).toMatch(/^JD-\d{6}-\d{4,6}$/);
    await expect(page.getByTestId("order-total")).toHaveText("138,000₮");
    await expect(page.getByTestId("order-status")).toHaveText("Хүлээгдэж буй");

    await expect(page.getByAltText("QPay QR код")).toBeVisible();
    await page.getByRole("button", { name: /Туршилтын төлбөр/ }).click();
    await expect(page.getByTestId("order-status")).toHaveText("Төлөгдсөн", { timeout: 15_000 });

    // Сагс хоосорсон
    await page.goto("/cart");
    await expect(page.getByText("Таны сагс хоосон байна")).toBeVisible();

    // Захиалга шалгах
    await page.goto("/track");
    await page.getByLabel("Утасны дугаар").fill("88001122");
    await page.getByLabel("Захиалгын дугаар").fill(orderNumber);
    await page.getByRole("button", { name: "Шалгах" }).click();
    await expect(page.getByText(orderNumber).last()).toBeVisible();
    await expect(page.getByText("Төлбөр баталгаажсан")).toBeVisible();

    // Буруу утас
    await page.getByLabel("Утасны дугаар").fill("88001199");
    await page.getByRole("button", { name: "Шалгах" }).click();
    await expect(page.getByText("Захиалга олдсонгүй")).toBeVisible();
  });

  test("дансаар шилжүүлэх + орон нутгийн хүргэлт", async ({ page }) => {
    await page.goto("/products/yoga-mat-6mm");
    await page.getByRole("button", { name: "Сагсанд нэмэх", exact: true }).click();
    await page.goto("/checkout");
    await fillCheckout(page, { phone: "99887766", method: "Дансаар шилжүүлэх" });
    await page.getByLabel("Дүүрэг *").selectOption("Орон нутаг");
    await page.getByLabel("Аймаг, сум *").fill("Дархан-Уул, Дархан");
    // 35,000 + орон нутаг 10,000
    await expect(page.getByText("45,000₮").first()).toBeVisible();
    await page.getByRole("button", { name: "Захиалга баталгаажуулах" }).click();
    await expect(page.getByText("Дансаар шилжүүлэх заавар")).toBeVisible();
    const orderNumber = (await page.getByTestId("order-number").textContent())!.trim();
    await expect(page.getByText("Гүйлгээний утга", { exact: true })).toBeVisible();
    await expect(page.locator("dd").filter({ hasText: orderNumber }).first()).toBeVisible();
  });

  test("токенгүй захиалгын хуудас нээгдэхгүй", async ({ page }) => {
    await page.goto("/order/JD-261019-0000?t=wrong");
    await expect(page.getByRole("heading", { name: "Захиалга олдсонгүй" })).toBeVisible();
  });

  test("мэдээллийн хуудсууд ба SEO", async ({ page, request }) => {
    for (const [path, h] of [
      ["/about", "Бидний тухай"],
      ["/contact", "Холбоо барих"],
      ["/faq", "Түгээмэл асуулт"],
      ["/shipping-returns", "Хүргэлт ба буцаалтын нөхцөл"],
      ["/privacy", "Нууцлалын бодлого"],
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: h })).toBeVisible();
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    }
    await page.goto("/contact");
    await expect(page.locator('a[href="tel:95209563"]').last()).toBeVisible();
    await expect(page.locator('a[href="mailto:lutaajamsran@gmail.com"]').last()).toBeVisible();

    await page.goto("/products/jd-watch-s2");
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /watch-1\.webp/);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);

    const sm = await request.get("/sitemap.xml");
    expect(sm.ok()).toBeTruthy();
    expect(await sm.text()).toContain("/products/jd-buds-pro");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
  });

  test("API: үнийг клиентээс авахгүй, хэт олон тоо зөвшөөрөхгүй", async ({ request }) => {
    const quote = await request.post("/api/cart/quote", { data: { items: [{ productId: "x", quantity: 1, price: 1 }] } });
    expect((await quote.json()).ok).toBe(false);
    const big = await request.post("/api/cart/quote", { data: { items: [{ productId: "x", quantity: 9999 }] } });
    expect(big.status()).toBe(400);
  });
});
