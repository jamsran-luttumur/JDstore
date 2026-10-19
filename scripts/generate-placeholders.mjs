// Placeholder зургуудыг үүсгэнэ: node scripts/generate-placeholders.mjs
// Админ самбараас жинхэнэ зургаар солих боломжтой.
import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";

const OUT = path.join(process.cwd(), "public/images/placeholders");
await mkdir(OUT, { recursive: true });

const W = "#FFFFFF";
const icons = {
  headphones: `<path d="M150 330v-60a150 150 0 0 1 300 0v60" fill="none" stroke="${W}" stroke-width="34" stroke-linecap="round"/>
    <rect x="118" y="300" width="80" height="140" rx="36" fill="${W}"/><rect x="402" y="300" width="80" height="140" rx="36" fill="${W}"/>`,
  watch: `<rect x="250" y="110" width="100" height="380" rx="40" fill="${W}" opacity=".55"/>
    <rect x="190" y="190" width="220" height="220" rx="64" fill="${W}"/>
    <rect x="215" y="215" width="170" height="170" rx="46" fill="currentColor"/>
    <path d="M300 250v52l36 26" stroke="${W}" stroke-width="16" stroke-linecap="round" fill="none"/>`,
  battery: `<rect x="180" y="130" width="240" height="340" rx="44" fill="${W}"/>
    <rect x="210" y="160" width="180" height="280" rx="26" fill="currentColor"/>
    <path d="M318 200l-64 110h52l-20 90 74-120h-54z" fill="${W}"/>`,
  kettle: `<path d="M190 250h220l-24 220H214z" fill="${W}"/><path d="M210 250q90-90 180 0" fill="${W}"/>
    <path d="M410 290q70 10 50 110" stroke="${W}" stroke-width="28" fill="none" stroke-linecap="round"/>
    <rect x="270" y="170" width="60" height="36" rx="14" fill="${W}"/>`,
  drop: `<path d="M300 120C250 210 190 280 190 360a110 110 0 0 0 220 0c0-80-60-150-110-240z" fill="${W}"/>
    <path d="M250 370a50 50 0 0 0 50 50" stroke="currentColor" stroke-width="18" fill="none" stroke-linecap="round"/>`,
  jar: `<rect x="190" y="230" width="220" height="210" rx="40" fill="${W}"/><rect x="175" y="180" width="250" height="70" rx="24" fill="${W}" opacity=".7"/>
    <rect x="235" y="300" width="130" height="70" rx="16" fill="currentColor" opacity=".35"/>`,
  dryer: `<circle cx="260" cy="260" r="120" fill="${W}"/><circle cx="260" cy="260" r="58" fill="currentColor"/>
    <rect x="370" y="225" width="110" height="70" rx="20" fill="${W}"/><rect x="230" y="350" width="70" height="140" rx="26" fill="${W}"/>`,
  scarf: `<path d="M200 140h200v90q-100 60-200 0z" fill="${W}"/><path d="M220 220h80v260l-40-30-40 30z" fill="${W}" opacity=".85"/>
    <path d="M310 220h80v200l-40-30-40 30z" fill="${W}" opacity=".65"/>`,
  jacket: `<path d="M240 130h120l120 80-40 90-40-24v204H180V276l-40 24-40-90 120-80z" fill="${W}"/>
    <path d="M300 160v300" stroke="currentColor" stroke-width="10"/><path d="M262 140l38 60 38-60" fill="none" stroke="currentColor" stroke-width="10"/>`,
  mat: `<rect x="150" y="200" width="300" height="200" rx="28" fill="${W}" transform="rotate(-12 300 300)"/>
    <circle cx="420" cy="380" r="62" fill="${W}" opacity=".8"/><circle cx="420" cy="380" r="26" fill="currentColor"/>`,
};

const palettes = [
  ["#1F4AE0", "#6E8CFF"], ["#0E7C66", "#43C59E"], ["#B4410E", "#FF8A4C"], ["#6D28D9", "#B48CFF"],
  ["#0B5394", "#3FA9F5"], ["#9D174D", "#F472B6"], ["#374151", "#9CA3AF"], ["#7C5A0B", "#F2B84B"],
  ["#14532D", "#6CC57C"], ["#155E75", "#5BC7DF"],
];

function product(icon, [a, b], variant) {
  const angle = [0, 35, 70][variant];
  const scale = [1, 0.85, 0.7][variant];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 600 600" color="${a}">
    <defs><linearGradient id="g" gradientTransform="rotate(${angle})"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="600" height="600" fill="url(#g)"/>
    <circle cx="520" cy="80" r="140" fill="#fff" opacity=".08"/><circle cx="60" cy="560" r="180" fill="#fff" opacity=".07"/>
    <g transform="translate(300 300) scale(${scale}) translate(-300 -300)">${icons[icon]}</g>
    <text x="300" y="560" text-anchor="middle" font-family="Inter" font-weight="700" font-size="22" fill="#fff" opacity=".75">JDstore</text>
  </svg>`;
}

const items = [
  ["buds", "headphones"], ["watch", "watch"], ["powerbank", "battery"], ["kettle", "kettle"], ["humidifier", "drop"],
  ["cream", "jar"], ["hairdryer", "dryer"], ["scarf", "scarf"], ["jacket", "jacket"], ["yogamat", "mat"],
];
for (let i = 0; i < items.length; i++) {
  const [name, icon] = items[i];
  for (let v = 0; v < 3; v++) {
    await sharp(Buffer.from(product(icon, palettes[i], v))).webp({ quality: 85 }).toFile(path.join(OUT, `${name}-${v + 1}.webp`));
  }
}

function banner([a, b], c, seed) {
  const circles = Array.from({ length: 6 }, (_, k) => {
    const x = 900 + ((seed * 131 + k * 197) % 700);
    const y = 60 + ((seed * 71 + k * 113) % 480);
    const r = 40 + ((seed * 17 + k * 53) % 160);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${0.06 + (k % 3) * 0.05}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="720">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>
    <rect width="1920" height="720" fill="url(#g)"/>${circles}
    <rect x="1180" y="140" width="440" height="440" rx="110" fill="#fff" opacity=".14" transform="rotate(14 1400 360)"/>
    <rect x="1260" y="220" width="280" height="280" rx="70" fill="#fff" opacity=".18" transform="rotate(-8 1400 360)"/>
  </svg>`;
}
const bannerPalettes = [["#0F1B4C", "#1F4AE0", "#5B7BFF"], ["#4A1606", "#C2410C", "#FF8A4C"], ["#06302A", "#0E7C66", "#43C59E"]];
for (let i = 0; i < 3; i++) {
  const [a, b, c] = bannerPalettes[i];
  await sharp(Buffer.from(banner([a, b], c, i + 1))).webp({ quality: 82 }).toFile(path.join(OUT, `banner-${i + 1}.webp`));
}

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0F1B4C"/><stop offset="1" stop-color="#1F4AE0"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1050" cy="120" r="220" fill="#fff" opacity=".06"/><circle cx="1100" cy="560" r="160" fill="#FF6A3D" opacity=".5"/>
  <rect x="90" y="215" width="112" height="112" rx="30" fill="#FF6A3D"/>
  <text x="146" y="292" text-anchor="middle" font-family="Inter" font-weight="800" font-size="56" fill="#fff">JD</text>
  <text x="230" y="300" font-family="Inter" font-weight="800" font-size="96" fill="#fff">JDstore</text>
  <text x="94" y="410" font-family="Inter" font-weight="500" font-size="40" fill="#C7D2FE">Онлайн дэлгүүр · Хурдан хүргэлт · QPay</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile(path.join(process.cwd(), "public/og.png"));
console.log("Placeholder зургууд бэлэн:", OUT);
