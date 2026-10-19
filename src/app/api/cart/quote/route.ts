import { z } from "zod";
import { buildQuote } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { error, json, limit, readJson } from "@/lib/http";
import { cartItemsSchema } from "@/lib/validation";
import { DISTRICTS } from "@/lib/constants";

const schema = z.object({
  items: cartItemsSchema,
  district: z.enum(DISTRICTS).optional(),
});

export async function POST(req: Request) {
  const limited = await limit("quote", 120, 60_000);
  if (limited) return limited;
  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return error("Хүсэлт буруу байна");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Сагсны мэдээлэл буруу байна");
  const quote = await buildQuote(parsed.data.items, parsed.data.district, await getSettings());
  return json(quote);
}
