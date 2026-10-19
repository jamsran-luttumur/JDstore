import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { getStore } from "@netlify/blobs";
import { randomToken } from "./tokens";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/**
 * Зургийг шалгаж, WebP болгон хөрвүүлж (max 1600px), хадгалаад нийтийн URL буцаана.
 * BLOB_READ_WRITE_TOKEN байвал Vercel Blob, Netlify дээр Netlify Blobs, үгүй бол ./uploads хавтас.
 */
export async function saveImage(file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new Error("Зөвхөн JPG, PNG, WEBP, AVIF зураг оруулна уу");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Зургийн хэмжээ 5MB-аас ихгүй байна");

  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  try {
    // sharp нь файлын агуулгыг өөрөө шалгадаг тул хуурамч MIME-тэй файл энд унана
    output = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error("Зургийн файл гэмтэлтэй эсвэл дэмжигдэхгүй байна");
  }

  const name = `${Date.now()}-${randomToken(9)}.webp`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${name}`, output, { access: "public", contentType: "image/webp" });
    return blob.url;
  }
  if (isNetlifyBlobs()) {
    await uploadsStore().set(name, new Uint8Array(output).buffer as ArrayBuffer, { metadata: { contentType: "image/webp" } });
    return `/uploads/${name}`;
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), output);
  return `/uploads/${name}`;
}

/** Netlify-ийн runtime дээр ажиллаж байгаа эсэх (Blobs context-ийг Netlify автоматаар тавина) */
export function isNetlifyBlobs(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN) return false;
  return (
    process.env.STORAGE_DRIVER === "netlify" ||
    Boolean(process.env.NETLIFY_BLOBS_CONTEXT) ||
    Boolean((globalThis as { netlifyBlobsContext?: unknown }).netlifyBlobsContext)
  );
}

export function uploadsStore() {
  return getStore({ name: "uploads", consistency: "strong" });
}
