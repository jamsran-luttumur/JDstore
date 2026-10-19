import { getAdminSession } from "@/lib/auth";
import { error, json } from "@/lib/http";
import { MAX_UPLOAD_BYTES, saveImage } from "@/lib/storage";

export async function POST(req: Request) {
  // proxy.ts хамгаалдаг ч энд дахин шалгана
  if (!(await getAdminSession())) return error("Нэвтрэх шаардлагатай", 401);

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return error("Forbidden", 403);

  if (Number(req.headers.get("content-length") || 0) > MAX_UPLOAD_BYTES + 100_000) {
    return error("Зургийн хэмжээ 5MB-аас ихгүй байна", 413);
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return error("Файл уншиж чадсангүй");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return error("Файл сонгоно уу");
  try {
    const url = await saveImage(file);
    return json({ url }, 201);
  } catch (e) {
    return error((e as Error).message || "Зураг хадгалахад алдаа гарлаа", 400);
  }
}
