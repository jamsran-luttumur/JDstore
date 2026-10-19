// Netlify-ийн хуваарьт функц: өдөр бүр 20:00 UTC (УБ 04:00)-д төлөгдөөгүй QPay захиалгыг цуцлах API-г дуудна.
// Vercel дээр vercel.json-ийн crons ижил үүрэгтэй.
const expireOrders = async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) return new Response("URL эсвэл CRON_SECRET тохируулаагүй", { status: 500 });
  const res = await fetch(`${base}/api/cron/expire-orders`, { headers: { Authorization: `Bearer ${secret}` } });
  return new Response(await res.text(), { status: res.status });
};

export default expireOrders;

export const config = { schedule: "0 20 * * *" };
