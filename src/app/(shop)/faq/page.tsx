import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageHeader } from "@/components/Section";
import { formatMNT } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Түгээмэл асуулт",
  description: "Захиалга, төлбөр, хүргэлт, буцаалтын талаар түгээмэл асуултууд.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const s = await getSettings();
  const faqs: { q: string; a: string }[] = [
    { q: "Хэрхэн захиалга өгөх вэ?", a: "Барааг сагсанд нэмээд “Захиалах” товч дарж, нэр, утас, хүргэлтийн хаягаа оруулж, төлбөрийн хэлбэрээ сонгоход захиалга бүртгэгдэнэ. Бүртгэл үүсгэх шаардлагагүй." },
    { q: "Ямар төлбөрийн хэлбэр байдаг вэ?", a: "QPay (бүх банкны апп), дансаар шилжүүлэх болон хүргэлтээр бэлнээр төлөх боломжтой. Дансаар шилжүүлэхдээ гүйлгээний утгад захиалгын дугаараа заавал бичнэ үү." },
    { q: "Хүргэлт хэдэн хоногт ирэх вэ?", a: "Улаанбаатар хотод төлбөр баталгаажсанаас хойш 24–48 цагт хүргэнэ. Орон нутагт унаанд тавьж өгөх ба 2–5 хоног болно." },
    {
      q: "Хүргэлтийн төлбөр хэд вэ?",
      a: `Улаанбаатар хотод ${formatMNT(s.shippingFeeUB)}${s.freeShippingThreshold > 0 ? `, ${formatMNT(s.freeShippingThreshold)}-өөс дээш захиалгад үнэгүй` : ""}. Орон нутаг руу ${formatMNT(s.shippingFeeRural)}.`,
    },
    { q: "Захиалгынхаа төлөвийг яаж харах вэ?", a: "“Захиалга шалгах” хуудсанд утасны дугаар болон захиалгын дугаараа оруулж төлөвөө харна." },
    { q: "Барааг буцааж болох уу?", a: "Бараа хүлээн авснаас хойш 7 хоногийн дотор, ашиглаагүй, сав баглаа боодол бүрэн тохиолдолд буцаах, солих боломжтой. Дэлгэрэнгүйг “Хүргэлт ба буцаалтын нөхцөл” хуудаснаас үзнэ үү." },
    { q: "Захиалгаа цуцалж болох уу?", a: `Хүргэлтэд гараагүй бол ${s.contactPhone} дугаарт залгаж цуцлуулах боломжтой. Төлбөр төлсөн бол 1–3 ажлын өдөрт буцаан олгоно.` },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHeader title="Түгээмэл асуулт">
        <Breadcrumbs items={[{ label: "Түгээмэл асуулт" }]} />
      </PageHeader>
      <div className="container-x max-w-3xl py-10">
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="card group p-0 open:shadow-sm" {...(i === 0 ? { open: true } : {})}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-lg leading-none transition group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-5 text-[15px] leading-7 text-slate-700">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted">
          Хариултаа олсонгүй юу? <Link href="/contact" className="font-semibold text-brand-600 hover:underline">Бидэнтэй холбогдоорой</Link>.
        </p>
      </div>
    </>
  );
}
