import type { Metadata } from "next";
import { Breadcrumbs, PageHeader } from "@/components/Section";
import { formatMNT } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Хүргэлт ба буцаалтын нөхцөл",
  description: "JDstore-ийн хүргэлтийн хугацаа, төлбөр, бараа буцаах болон солих нөхцөл.",
  alternates: { canonical: "/shipping-returns" },
};

export default async function ShippingReturnsPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader title="Хүргэлт ба буцаалтын нөхцөл">
        <Breadcrumbs items={[{ label: "Хүргэлт ба буцаалт" }]} />
      </PageHeader>
      <div className="container-x py-10">
        <div className="prose-jd max-w-3xl">
          <h2>Хүргэлт</h2>
          <ul>
            <li>Улаанбаатар хотын 9 дүүрэгт хүргэлтийн төлбөр <b>{formatMNT(s.shippingFeeUB)}</b>.</li>
            {s.freeShippingThreshold > 0 && <li><b>{formatMNT(s.freeShippingThreshold)}</b>-өөс дээш захиалгад УБ хотод хүргэлт <b>үнэгүй</b>.</li>}
            <li>Орон нутаг руу унаанд тавьж өгөх үйлчилгээ <b>{formatMNT(s.shippingFeeRural)}</b> (унааны төлбөрийг хүлээн авагч төлнө).</li>
            <li>Төлбөр баталгаажсан (эсвэл бэлэн төлбөрт захиалга баталгаажсан) өдрөөс хойш УБ-д 24–48 цагт хүргэнэ.</li>
            <li>Хүргэлтийн ажилтан хүргэхээс өмнө утсаар холбогдоно. Утсаа нээлттэй байлгана уу.</li>
            <li>Баярын болон цаг агаарын онцгой нөхцөлд хугацаа сунжирч болно.</li>
          </ul>

          <h2>Бараа хүлээн авах</h2>
          <ul>
            <li>Бараагаа хүлээн авахдаа сав баглаа боодол, гадаад байдлыг шалгана уу.</li>
            <li>Гэмтэл, дутуу зүйл байвал хүргэлтийн ажилтанд тэр дор нь мэдэгдэнэ үү.</li>
          </ul>

          <h2>Буцаалт ба солилт</h2>
          <ul>
            <li>Бараа хүлээн авснаас хойш <b>7 хоногийн дотор</b> буцаах, солих хүсэлт гаргах боломжтой.</li>
            <li>Бараа ашиглагдаагүй, шошго, сав баглаа боодол бүрэн, баримттай байх шаардлагатай.</li>
            <li>Үйлдвэрийн гэмтэлтэй бол хүргэлтийн зардлыг JDstore хариуцна.</li>
            <li>Хэрэглэгчийн хүслээр буцаах үед хүргэлтийн зардлыг хэрэглэгч хариуцна.</li>
            <li>Гоо сайхны онгойлгосон бүтээгдэхүүн, дотуур хувцас эрүүл ахуйн шаардлагаар буцаагдахгүй.</li>
          </ul>

          <h2>Төлбөр буцаан олголт</h2>
          <p>Буцаалт баталгаажсанаас хойш 1–3 ажлын өдөрт таны дансанд шилжүүлнэ.</p>

          <h2>Холбогдох</h2>
          <p>
            Буцаалт, солилтын хүсэлтээ <a href={`tel:${s.contactPhone}`}>{s.contactPhone}</a> утсаар эсвэл{" "}
            <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a> хаягаар захиалгын дугаартайгаа хамт илгээнэ үү.
          </p>
        </div>
      </div>
    </>
  );
}
