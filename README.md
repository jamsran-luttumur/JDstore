# JDstore — Онлайн дэлгүүр

Next.js 16 (App Router) + TypeScript + Tailwind CSS + PostgreSQL (Prisma) дээр хийгдсэн, бодит ашиглалтад бэлэн монгол хэлтэй онлайн дэлгүүр.

- **Дэлгүүр:** нүүр хуудас (баннер слайд, онцлох, бестселлер, хямдрал, ангилал тус бүр), бүх бараа (ангилал/үнийн шүүлт, эрэмбэ, хайлт, хуудаслалт), барааны дэлгэрэнгүй (олон зураг, үлдэгдэл, тоо сонгох), сагс, захиалга, амжилттай хуудас, захиалга шалгах, 5 мэдээллийн хуудас
- **Төлбөр:** QPay (invoice → QR → callback → QPay API-аар дахин шалгалт), дансаар шилжүүлэх, хүргэлтээр бэлнээр
- **Админ:** бараа/ангилал/баннер CRUD, зураг upload, онцлох бараа, захиалгын жагсаалт, шүүлт, төлөв, өдөр/сарын тайлан, тохиргоо, нууц үг солих
- **Аюулгүй байдал:**
  - Үнийг зөвхөн сервер талд тооцно
  - Үлдэгдлийг атомар хасна
  - Давхар төлбөрөөс хамгаална
  - Нууц үгийг bcrypt-ээр hash-лана
  - Оролтыг zod-оор шалгана
  - CSP болон аюулгүй байдлын header-үүд тавина
  - Rate limit хийнэ
- **SEO:** хуудас бүрт title, description, Open Graph; `sitemap.xml`, `robots.txt`, JSON-LD (Product, FAQ, OnlineStore)

---

## 1. Файлын бүтэц

```
prisma/
  schema.prisma          Өгөгдлийн сангийн схем
  migrations/            SQL migration-ууд
  seed.ts                5 ангилал, 10 бараа, 3 баннер, админ
scripts/generate-placeholders.mjs   Placeholder зураг үүсгэгч
public/images/placeholders/         Seed-ийн зургууд (админаас солино)
src/
  app/
    (shop)/              Дэлгүүрийн хуудсууд (header/footer-тэй)
      page.tsx           Нүүр
      products/          Бүх бараа, [slug] дэлгэрэнгүй
      category/[slug]/   Ангилал
      cart/ checkout/ order/[number]/ track/
      about/ contact/ faq/ shipping-returns/ privacy/
    admin/               Админ самбар (login + (panel)/...)
      actions.ts         Админы бүх server action (requireAdmin-аар хамгаалсан)
    api/
      cart/quote         Сагсны дүнг серверээр тооцох
      orders, orders/track
      qpay/invoice | check | callback | mock-pay
      admin/upload       Зураг upload
      cron/expire-orders Төлөгдөөгүй QPay захиалгыг цуцлах
    uploads/[...path]    Локал зургийг үйлчлэх
    sitemap.ts robots.ts
  components/            UI компонентууд (cart/, layout/, admin/)
  lib/
    orders.ts            Захиалга, үлдэгдэл, QPay баталгаажуулалт (гол логик)
    pricing.ts           Үнийн тооцоо (зөвхөн DB-ээс)
    qpay.ts              QPay v2 клиент (+ mock горим)
    auth.ts session.ts   Админ нэвтрэлт (bcrypt + JWT cookie)
    validation.ts        zod схемүүд
    settings.ts          Тохиргоо (DB → .env → анхны утга)
    mailer.ts storage.ts reports.ts rate-limit.ts
  proxy.ts               /admin, /api/admin хамгаалалт
tests/e2e/               Playwright тестүүд
```

## 2. Өгөгдлийн сангийн схем (товч)

| Хүснэгт | Гол талбарууд |
|---|---|
| `Category` | name, slug (unique), description, sortOrder |
| `Product` | name, slug, description, price, salePrice?, stock, isFeatured, isActive, soldCount, categoryId |
| `ProductImage` | url, alt, sortOrder, productId |
| `Banner` | title, subtitle, imageUrl, linkUrl, isActive, sortOrder |
| `Order` | orderNumber (unique, `JD-YYMMDD-XXXX`), customerName, phone, district, khoroo, address, note, paymentMethod, status, subtotal, shippingFee, total, paidAt |
| `OrderItem` | productName, unitPrice, quantity, lineTotal (захиалсан үеийн үнийг хадгална) |
| `Payment` | invoiceId (unique), qpayPaymentId (unique), amount, paidAmount, status, callbackToken (unique), qr… |
| `AdminUser` | email, passwordHash (bcrypt) |
| `Setting` | key/value — утас, и-мэйл, Facebook, данс, хүргэлтийн үнэ |

Захиалгын төлөвүүд: `PENDING` (хүлээгдэж буй), `PAID` (төлөгдсөн), `SHIPPING` (хүргэлтэд), `DELIVERED` (хүргэгдсэн), `CANCELLED` (цуцлагдсан).

---

## 3. Локал орчинд ажиллуулах

Шаардлага: **Node.js 20.9+** (22 зөвлөнө), **PostgreSQL 14+**.

```bash
# 1) Сангууд суулгах
npm install

# 2) Орчны хувьсагч
cp .env.example .env
#   DATABASE_URL, AUTH_SECRET (openssl rand -base64 48), ADMIN_EMAIL, ADMIN_PASSWORD-г заавал тохируул
#   Локал туршилтад QPAY_MODE="mock" болго

# 3) Өгөгдлийн сан: migration + seed
npx prisma migrate dev        # хүснэгтүүд үүснэ
npm run db:seed               # 10 бараа, ангилал, баннер, админ

# 4) Ажиллуулах
npm run dev                   # http://localhost:3000
# Админ: http://localhost:3000/admin  (ADMIN_EMAIL / ADMIN_PASSWORD)
```

Бусад командууд:

| Команд | Үүрэг |
|---|---|
| `npm run build && npm start` | Production build + ажиллуулах |
| `npm run lint` / `npm run typecheck` | Код шалгах |
| `npm run db:deploy` | Migration-ыг production DB-д хэрэгжүүлэх (`prisma migrate deploy`) |
| `npm run db:seed` | Seed (дахин ажиллуулахад одоо байгаа барааг дарж бичихгүй, админы нууц үгийг .env-ээр шинэчилнэ) |
| `npm run db:studio` | Prisma Studio (DB-г хөтчөөр харах) |
| `npm run images:placeholders` | Placeholder зургийг дахин үүсгэх |
| `npm run test:e2e` | Playwright тест (`npm run build`-ийн дараа; `ADMIN_PASSWORD` env шаардана) |

### Орчны хувьсагчид

| Нэр | Тайлбар |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Сайтын бүтэн хаяг, жишээ `https://jdstore.mn` (SEO, QPay callback) |
| `DATABASE_URL` | PostgreSQL холболт |
| `AUTH_SECRET` | 32+ тэмдэгт санамсаргүй мөр (session, захиалгын холбоосны гарын үсэг) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seed үед үүсэх админ (нууц үг 10+ тэмдэгт) |
| `NEXT_PUBLIC_CONTACT_PHONE/EMAIL`, `NEXT_PUBLIC_FACEBOOK_URL` | Холбоо барих мэдээллийн анхны утга (админ → Тохиргоо-оос дарж бичнэ) |
| `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`, `ORDER_NOTIFY_EMAIL` | Шинэ захиалгын и-мэйл мэдэгдэл |
| `QPAY_MODE` | `mock` / `sandbox` / `production` |
| `QPAY_BASE_URL`, `QPAY_CLIENT_ID`, `QPAY_CLIENT_SECRET`, `QPAY_INVOICE_CODE`, `QPAY_INVOICE_RECEIVER_CODE` | QPay мэдээлэл |
| `QPAY_ENABLED` | `false` бол QPay сонголт нуугдана (гэрээ хийгдэхээс өмнө) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (зураг хадгалах). Хоосон бол `./uploads` хавтас |
| `CRON_SECRET`, `QPAY_ORDER_EXPIRE_HOURS` | Төлөгдөөгүй QPay захиалгыг автоматаар цуцлах |

> `.env` файл `.gitignore`-д орсон. Нууц түлхүүрээ хэзээ ч git-д бүү оруул.

---

## 4. Vercel дээр байршуулах (алхам алхмаар)

1. **Кодыг GitHub руу push хийнэ.**
   ```bash
   git remote add origin https://github.com/<таны-нэр>/jdstore.git
   git push -u origin main
   ```
2. **Vercel-д импортлох:** [vercel.com/new](https://vercel.com/new) → GitHub repo-гоо сонгоно. Framework нь автоматаар Next.js гэж танигдана.
3. **Өгөгдлийн сан үүсгэх:** Vercel Project → **Storage** → **Create Database** → **Neon (Postgres)** → Region: Singapore эсвэл Tokyo (Монголд ойр). `DATABASE_URL` автоматаар нэмэгдэнэ.
   - Neon/Supabase-аас өөрөө үүсгэж, `DATABASE_URL`-ыг гараар оруулж болно (`?sslmode=require`).
4. **Зураг хадгалах:** **Storage** → **Create** → **Blob** → project-д холбоно. `BLOB_READ_WRITE_TOKEN` автоматаар нэмэгдэнэ.
5. **Environment Variables** (Settings → Environment Variables) хэсэгт `.env.example`-ийн дагуу оруулна:
   - `NEXT_PUBLIC_SITE_URL` = `https://<project>.vercel.app` (домэйн холбосны дараа солино)
   - `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CRON_SECRET`
   - `QPAY_MODE=sandbox` болон бусад `QPAY_*`
   - `SMTP_*`, `ORDER_NOTIFY_EMAIL`
6. **Build command:** `package.json` дахь `vercel-build` script-ийг Vercel автоматаар ашиглана. Энэ нь deploy бүрт `prisma generate && prisma migrate deploy && prisma db seed && next build` ажиллуулна:
   - Migration-ыг хэрэгжүүлнэ.
   - Анхны бараа, ангилал, баннерыг оруулна. Seed нь одоо байгаа барааг дарж бичихгүй, баннер байхгүй үед л нэмнэ.
   - Админы нууц үгийг `ADMIN_PASSWORD`-аар шинэчилнэ.
7. **Deploy** дарна.
8. (Нэмэлт) Seed-ийг гараар ажиллуулах бол: `DATABASE_URL="<production-url>" npm run db:seed`
9. `https://<домэйн>/admin` руу нэвтэрч, **Тохиргоо** хэсэгт дансны мэдээлэл, хүргэлтийн үнийг оруулна. **Бараа** хэсэгт placeholder зургийг жинхэнэ зургаар солино.
10. **Cron:** `vercel.json` дотор `/api/cron/expire-orders` өдөр бүр 20:00 UTC-д (УБ 04:00) ажиллахаар тохируулсан. Vercel нь `CRON_SECRET`-ийг автоматаар `Authorization` header-т илгээнэ.

## 5. Railway дээр байршуулах (сонголт)

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. **+ New → Database → PostgreSQL** нэмээд app service-ийн Variables хэсэгт `DATABASE_URL=${{Postgres.DATABASE_URL}}` гэж холбоно.
3. Бусад env хувьсагчдыг (`.env.example`) оруулна.
4. Settings хэсэгт:
   - **Build Command:** `npm run build`
   - **Start Command:** `npx prisma migrate deploy && npm start`
5. **Зураг:** Railway-ийн файлын систем түр зуурын. Service-д **Volume** нэмж `/app/uploads` руу mount хийнэ. Эсвэл `BLOB_READ_WRITE_TOKEN`-оор Vercel Blob ашиглана.
6. Seed: Railway CLI-ээр `railway run npm run db:seed`.
7. **Cron:** Railway Cron service үүсгээд өдөрт нэг удаа дараах командыг ажиллуулна:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://<домэйн>/api/cron/expire-orders
   ```

## 6. Домэйн холбох

1. Vercel Project → **Settings → Domains** → `jdstore.mn` болон `www.jdstore.mn`-г нэмнэ.
2. Домэйн бүртгэгчийн DNS тохиргоонд:
   - `jdstore.mn` → **A** бичлэг `76.76.21.21`
   - `www` → **CNAME** `cname.vercel-dns.com`

   Vercel яг ямар утга оруулахыг Domains хуудсандаа харуулна, тэрийг дагана.
3. SSL сертификат автоматаар гарна (хэдэн минут).
4. `NEXT_PUBLIC_SITE_URL=https://jdstore.mn` болгож **Redeploy** хийнэ. Энэ нь sitemap, OG зураг, QPay callback URL-д ашиглагдана.
5. Google Search Console-д домэйнээ бүртгүүлээд `https://jdstore.mn/sitemap.xml`-ийг илгээнэ.

## 7. QPay: sandbox → production

**Sandbox (туршилт):**
```
QPAY_MODE="sandbox"
QPAY_BASE_URL="https://merchant-sandbox.qpay.mn"
QPAY_CLIENT_ID="TEST_MERCHANT"
QPAY_CLIENT_SECRET="123456"
QPAY_INVOICE_CODE="TEST_INVOICE"
```
Sandbox-д үүссэн QR-ийг QPay-ийн туршилтын апп-аар төлж шалгана.

Callback нь интернэтээс хандах боломжтой URL шаарддаг. Иймд sandbox-ийг заавал deploy хийсэн (Vercel preview) орчинд туршина. `localhost` дээр callback ирэхгүй, гэхдээ "Төлбөр шалгах" товч болон автомат шалгалт ажиллана.

**Production руу шилжих:**
1. QPay-тэй (qpay.mn) merchant гэрээ байгуулж, `client_id`, `client_secret`, `invoice_code` авна.
2. Vercel env-д дараах утгуудыг тавина:
   ```
   QPAY_MODE="production"
   QPAY_BASE_URL="https://merchant.qpay.mn"
   QPAY_CLIENT_ID="<гэрээгээр авсан>"
   QPAY_CLIENT_SECRET="<гэрээгээр авсан>"
   QPAY_INVOICE_CODE="<гэрээгээр авсан>"
   QPAY_ENABLED="true"
   ```
3. `NEXT_PUBLIC_SITE_URL` нь жинхэнэ HTTPS домэйн байх ёстой (callback: `https://jdstore.mn/api/qpay/callback?token=...`).
4. Redeploy хийж, бага дүнтэй (жишээ нь 100₮-ийн туршилтын бараа) жинхэнэ гүйлгээгээр шалгана.
5. Админ → Тохиргоо хэсгийн "QPay горим" нь `production` гэж харагдаж байгааг шалгана.

**Гэрээ хийгдэхээс өмнө:** `QPAY_ENABLED="false"` болговол захиалгын хуудсанд зөвхөн "Дансаар шилжүүлэх" болон "Хүргэлтээр бэлнээр" сонголт үлдэнэ. Дансаар төлсөн захиалгыг админ дансны хуулгатай тулгаад "Төлөгдсөн" болгоно. Гүйлгээний утгад захиалгын дугаарыг бичүүлнэ.

> ⚠ `QPAY_MODE="mock"` нь зөвхөн локал туршилтад зориулагдсан, жинхэнэ төлбөр авдаггүй. Production-д хэзээ ч бүү ашигла.

### Төлбөрийн баталгаажуулалт хэрхэн ажилладаг вэ

1. Захиалагч QPay сонгоход сервер `order.total`-оор (DB-ээс) invoice үүсгэнэ. Захиалгын мөрийг `SELECT … FOR UPDATE`-ээр түгжих тул зэрэг ирсэн хүсэлт давхар invoice үүсгэхгүй.
2. QPay `callback_url`-г дуудахад callback-ийн агуулгад итгэхгүй. Токеноор invoice-ийг олж, **`/v2/payment/check` API-аар дахин шалгана**.
3. Төлсөн дүн ≥ захиалгын дүн бол `Payment` (`status = NEW → PAID`) болон `Order` (`PENDING → PAID`)-ийг нөхцөлт атомар update-ээр шинэчилнэ. Callback олон удаа ирсэн ч ганц л удаа бүртгэгдэнэ, `qpayPaymentId` unique.
4. Хэрэглэгчийн хуудас 5 секунд тутам ижил шалгалтыг хийнэ.
5. 24 цагийн дотор төлөгдөөгүй QPay захиалгыг cron сүүлийн удаа шалгаад цуцалж, үлдэгдлийг буцаана.

## 8. И-мэйл мэдэгдэл (Gmail)

1. Gmail → Google Account → **Security** → **2-Step Verification**-ийг асаана.
2. **App passwords** → "JDstore" нэртэй нууц үг үүсгэнэ (16 тэмдэгт).
3. Дараах тохиргоог хийнэ:
   ```
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="465"
   SMTP_USER="таны@gmail.com"
   SMTP_PASS="<app password>"
   MAIL_FROM="JDstore <таны@gmail.com>"
   ORDER_NOTIFY_EMAIL="lutaajamsran@gmail.com"
   ```

Мэдэгдэл хүлээн авах хаягийг админ → Тохиргоо хэсгээс бас солих боломжтой. SMTP тохируулаагүй үед захиалга хэвийн бүртгэгдэх ба серверийн log-д л бичигдэнэ.

## 9. Аюулгүй байдлын тэмдэглэл

- **Үнэ:** клиентээс зөвхөн `productId` + `quantity` хүлээн авна. Үнэ, хямдрал, хүргэлт, нийт дүнг сервер DB-ээс тооцно.
- **Үлдэгдэл:** `UPDATE … WHERE stock >= q` нөхцөлтэйгөөр transaction дотор хасна. Нэг ч бараа хүрэлцэхгүй бол бүх захиалга буцаана. Цуцлахад үлдэгдэл буцаж нэмэгдэнэ.
- **Захиалгын хуудас:** `?t=` HMAC токентой байж л нээгдэнэ, тиймээс дугаар таагаад бусдын хаягийг харах боломжгүй.
- **Захиалга шалгах:** утас болон дугаар хоёулаа таарах шаардлагатай, rate limit-тэй.
- **Админ:**
  - `proxy.ts` болон server action бүрийн `requireAdmin()` гэсэн хоёр давхар хамгаалалттай
  - Cookie нь `httpOnly`, `secure`, `sameSite=lax`
  - Нэвтрэх оролдлогыг хязгаарласан (8 удаа / 15 мин)
- **Зураг upload:** зөвхөн админ хийнэ. 5MB хүртэл, JPG/PNG/WEBP/AVIF. sharp-аар дахин кодлон WebP болгоно, ингэснээр хортой агуулга арилна.
- **XSS / SQL injection:** Prisma-ийн параметртэй query ашиглана, React автоматаар escape хийнэ, JSON-LD-д `<`-ийг escape хийнэ. CSP: `frame-ancestors 'none'`, `object-src 'none'`.
- **Rate limit:** санах ойд хадгалагдана (instance тус бүрт). Их ачаалалтай үед Upstash Redis зэрэгт шилжүүлэхийг зөвлөнө.

## 10. Тест

```bash
npm run build
ADMIN_PASSWORD="<таны нууц үг>" npm run test:e2e
# Chromium өөр замд байвал: PW_CHROMIUM_PATH=/path/to/chrome
```

Тестүүд дараах урсгалыг бүрэн шалгана (`QPAY_MODE=mock`-оор асаана):
- Бараа үзэх, хайх, шүүх
- Сагс → QPay захиалга → төлбөр баталгаажих → захиалга шалгах
- Дансаар шилжүүлэх + орон нутгийн хүргэлт
- Админ: нэвтрэлт, бараа нэмэх (зураг upload), төлөв солих, цуцлахад үлдэгдэл буцах, тайлан, тохиргоо
- Утсан дээрх цэс болон сагс
