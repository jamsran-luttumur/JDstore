import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR, uploadsStore, isNetlifyBlobs } from "@/lib/storage";

/** Локал эсвэл Netlify Blobs-д хадгалсан зургийг үйлчилнэ (Vercel Blob ашиглаагүй үед) */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const name = parts.join("/");
  if (!/^[\w-]+\.webp$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const data = isNetlifyBlobs()
      ? await uploadsStore().get(name, { type: "arrayBuffer" })
      : await readFile(path.join(UPLOAD_DIR, name));
    if (!data) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
