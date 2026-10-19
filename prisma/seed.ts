import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const img = (name: string) => [1, 2, 3].map((i) => `/images/placeholders/${name}-${i}.webp`);

const categories = [
  { slug: "electronics", name: "Электроник", description: "Чихэвч, ухаалаг цаг, цэнэглэгч болон бусад гаджет", sortOrder: 1 },
  { slug: "home", name: "Гэр ахуй", description: "Гэрийн тав тухыг нэмэх цахилгаан хэрэгсэл", sortOrder: 2 },
  { slug: "beauty", name: "Гоо сайхан", description: "Арьс арчилгаа, үс засалтын бүтээгдэхүүн", sortOrder: 3 },
  { slug: "fashion", name: "Хувцас", description: "Өдөр тутмын болон улирлын хувцас, хэрэглэл", sortOrder: 4 },
  { slug: "sports", name: "Спорт", description: "Идэвхтэй амьдралын хэв маягт зориулсан бараа", sortOrder: 5 },
];

const products = [
  {
    slug: "jd-buds-pro", category: "electronics", name: "Утасгүй чихэвч JD Buds Pro", images: img("buds"),
    price: 89000, salePrice: 69000, stock: 25, isFeatured: true, soldCount: 64,
    description:
      "Идэвхтэй дуу чимээ тусгаарлагч (ANC) бүхий утасгүй чихэвч.\n\n• Bluetooth 5.3, хурдан холболт\n• Нэг цэнэглэлтээр 8 цаг, хайрцагтайгаа 32 цаг\n• IPX5 ус, хөлсөнд тэсвэртэй\n• Дуудлагын тод микрофон\n\nБаталгаат хугацаа: 6 сар.",
  },
  {
    slug: "jd-watch-s2", category: "electronics", name: "Ухаалаг цаг JD Watch S2", images: img("watch"),
    price: 149000, salePrice: 129000, stock: 12, isFeatured: true, soldCount: 38,
    description:
      "1.9 инчийн AMOLED дэлгэцтэй ухаалаг цаг.\n\n• Зүрхний цохилт, хүчилтөрөгч, нойр хянах\n• 100+ спортын горим\n• Утасны мэдэгдэл, дуудлага\n• 10 хүртэл хоног цэнэг барина\n\niOS болон Android-тай нийцтэй.",
  },
  {
    slug: "power-bank-20000", category: "electronics", name: "Зөөврийн цэнэглэгч 20000mAh", images: img("powerbank"),
    price: 59000, salePrice: null, stock: 40, isFeatured: false, soldCount: 91,
    description:
      "Өндөр багтаамжтай, 22.5W хурдан цэнэглэгчтэй зөөврийн батарей.\n\n• USB-C болон 2× USB-A гаралт\n• Нэг дор 3 төхөөрөмж цэнэглэнэ\n• LED үлдэгдэл заагч\n• Хүйтэнд тэсвэртэй (-20°C)",
  },
  {
    slug: "electric-kettle-17", category: "home", name: "Цахилгаан данх 1.7л", images: img("kettle"),
    price: 45000, salePrice: 39000, stock: 18, isFeatured: true, soldCount: 47,
    description:
      "Зэвэрдэггүй гангаар хийсэн, 2200W хүчин чадалтай данх.\n\n• 1.7 литр багтаамж\n• Ус буцалмагц автоматаар унтарна\n• Усгүй үед асахаас хамгаална\n• 360° эргэдэг суурь",
  },
  {
    slug: "air-humidifier", category: "home", name: "Агаар чийгшүүлэгч 4л", images: img("humidifier"),
    price: 79000, salePrice: null, stock: 10, isFeatured: false, soldCount: 22,
    description:
      "Өвлийн хуурай агаарт зориулсан хэт авианы чийгшүүлэгч.\n\n• 4 литр усны сав, 30 цаг тасралтгүй ажиллана\n• Чимээ багатай (≤28dB) — унтлагын өрөөнд тохиромжтой\n• Шөнийн гэрэл, 3 шатлалт тохиргоо\n• Анхилуун тос хийх хэсэгтэй",
  },
  {
    slug: "face-moisturizer-50", category: "beauty", name: "Нүүрний чийгшүүлэгч тос 50мл", images: img("cream"),
    price: 38000, salePrice: 32000, stock: 30, isFeatured: false, soldCount: 56,
    description:
      "Хиалуроны хүчил, керамид агуулсан өдөр, шөнийн чийгшүүлэгч.\n\n• Хуурай болон хэвийн арьсанд\n• Тосгүй, хурдан шингэнэ\n• Үнэргүй, мэдрэг арьсанд тохиромжтой\n• 50 мл",
  },
  {
    slug: "hair-dryer-2000w", category: "beauty", name: "Үс хатаагч 2000W", images: img("hairdryer"),
    price: 65000, salePrice: null, stock: 15, isFeatured: true, soldCount: 19,
    description:
      "Ионы технологитой, үсийг гэмтээхгүй хурдан хатаагч.\n\n• 2000W хүчин чадал\n• 3 халуун, 2 хурдны горим\n• Хүйтэн салхины товч\n• 2 төрлийн хошуутай",
  },
  {
    slug: "cashmere-scarf", category: "fashion", name: "Ноолууран ороолт", images: img("scarf"),
    price: 120000, salePrice: 99000, stock: 8, isFeatured: true, soldCount: 33,
    description:
      "100% монгол ямааны ноолуураар хийсэн зөөлөн, дулаан ороолт.\n\n• Хэмжээ: 180 × 30 см\n• Гараар угаах эсвэл хими цэвэрлэгээ\n• Бэлэгт тохиромжтой хайрцагтай",
  },
  {
    slug: "light-jacket", category: "fashion", name: "Хөнгөн куртка", images: img("jacket"),
    price: 189000, salePrice: null, stock: 6, isFeatured: false, soldCount: 11,
    description:
      "Хавар, намрын улиралд зориулсан салхинаас хамгаалах хөнгөн куртка.\n\n• Ус нэвтрүүлэхгүй гадар\n• Нуугдмал малгайтай\n• Хэмжээ: S, M, L, XL (захиалгын тайлбарт бичнэ үү)\n• 2 гадна, 1 дотор халаас",
  },
  {
    slug: "yoga-mat-6mm", category: "sports", name: "Иогийн дэвсгэр 6мм", images: img("yogamat"),
    price: 42000, salePrice: 35000, stock: 22, isFeatured: false, soldCount: 29,
    description:
      "Гулгадаггүй, байгальд ээлтэй TPE материалаар хийсэн дэвсгэр.\n\n• 183 × 61 см, 6 мм зузаан\n• Хоёр талын бүтэцтэй\n• Мөрөнд зүүх оосортой\n• Угаахад хялбар",
  },
];

const banners = [
  { title: "Шинэ улирлын гаджетууд", subtitle: "Ухаалаг цаг, чихэвч 25% хүртэл хямдралтай", imageUrl: "/images/placeholders/banner-1.webp", linkUrl: "/category/electronics", sortOrder: 1 },
  { title: "Гэрийн дулаан, тав тух", subtitle: "Өвлийн бэлтгэлээ JDstore-оос", imageUrl: "/images/placeholders/banner-2.webp", linkUrl: "/category/home", sortOrder: 2 },
  { title: "100,000₮-өөс дээш үнэгүй хүргэлт", subtitle: "Улаанбаатар хотод 24–48 цагт хүргэнэ", imageUrl: "/images/placeholders/banner-3.webp", linkUrl: "/products?sale=1", sortOrder: 3 },
];

async function main() {
  const catIds: Record<string, string> = {};
  for (const c of categories) {
    const row = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    catIds[c.slug] = row.id;
  }

  for (const p of products) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue; // админаас зассан өгөгдлийг дарж бичихгүй
    await prisma.product.create({
      data: {
        slug: p.slug, name: p.name, description: p.description, price: p.price, salePrice: p.salePrice,
        stock: p.stock, isFeatured: p.isFeatured, soldCount: p.soldCount, categoryId: catIds[p.category],
        images: { create: p.images.map((url, i) => ({ url, alt: p.name, sortOrder: i })) },
      },
    });
  }

  if ((await prisma.banner.count()) === 0) await prisma.banner.createMany({ data: banners });

  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 10 || /change-me/.test(password)) {
    console.warn("⚠ ADMIN_EMAIL / ADMIN_PASSWORD (10+ тэмдэгт) .env-д тохируулаагүй тул админ үүсгэсэнгүй");
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.upsert({ where: { email }, update: { passwordHash }, create: { email, passwordHash } });
    console.log(`✓ Админ: ${email}`);
  }

  console.log(`✓ ${categories.length} ангилал, ${products.length} бараа, ${banners.length} баннер`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
