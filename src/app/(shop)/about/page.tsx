import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageHeader } from "@/components/Section";
import { IconQr, IconShield, IconTruck } from "@/components/icons";

export const metadata: Metadata = {
  title: "Бидний тухай",
  description: "JDstore онлайн дэлгүүрийн тухай — бидний зорилго, үнэт зүйлс.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader title="Бидний тухай">
        <Breadcrumbs items={[{ label: "Бидний тухай" }]} />
      </PageHeader>
      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_380px]">
        <div className="prose-jd max-w-3xl">
          <p className="text-lg text-ink">
            <b>JDstore</b> бол өдөр тутмын хэрэглээнд хэрэгтэй, чанартай барааг хүртээмжтэй үнээр, хурдан шуурхай хүргэх зорилготой монгол онлайн дэлгүүр юм.
          </p>
          <p>
            Бид электроник, гэр ахуй, гоо сайхан, хувцас, спортын барааг нэг дороос сонгож, хэдхэн товшилтоор захиалах боломжийг бүрдүүлсэн. Бараа бүрийг чанар,
            баталгааг нь шалгасны үндсэн дээр санал болгодог.
          </p>
          <h2>Бидний амлалт</h2>
          <ul>
            <li>Бодит зураг, үнэн зөв тайлбар, ил тод үнэ</li>
            <li>Улаанбаатар хотод 24–48 цагт хүргэлт, орон нутагт унаанд тавьж өгнө</li>
            <li>QPay, дансаар шилжүүлэх болон хүргэлтээр бэлнээр төлөх боломж</li>
            <li>7 хоногийн дотор буцаах, солих нөхцөл</li>
            <li>Хэрэглэгчийн мэдээллийг чандлан хамгаална</li>
          </ul>
          <p>
            Асуух зүйл байвал <Link href="/contact">холбоо барих</Link> хуудсаар бидэнтэй холбогдоорой.
          </p>
        </div>
        <div className="space-y-3">
          {[
            { icon: IconTruck, t: "Хурдан хүргэлт", d: "Захиалгаа баталгаажуулснаас хойш 24–48 цагт." },
            { icon: IconShield, t: "Найдвартай", d: "Чанарын баталгаатай бараа, буцаалтын ойлгомжтой нөхцөл." },
            { icon: IconQr, t: "Хялбар төлбөр", d: "QPay-ээр бүх банкны аппаар төлөх боломжтой." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="card flex gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon width={22} height={22} />
              </span>
              <div>
                <p className="font-bold">{t}</p>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
