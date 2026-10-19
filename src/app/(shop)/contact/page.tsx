import type { Metadata } from "next";
import { Breadcrumbs, PageHeader } from "@/components/Section";
import { IconClock, IconFacebook, IconMail, IconPhone, IconPin } from "@/components/icons";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Холбоо барих",
  description: "JDstore-той холбогдох: утас 95209563, и-мэйл, Facebook хуудас.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const items = [
    { icon: IconPhone, label: "Утас", value: s.contactPhone, href: `tel:${s.contactPhone}`, note: "Дарж шууд залгана" },
    { icon: IconMail, label: "И-мэйл", value: s.contactEmail, href: `mailto:${s.contactEmail}` },
    { icon: IconFacebook, label: "Facebook", value: s.facebookName, href: s.facebookUrl, external: true },
    { icon: IconClock, label: "Ажлын цаг", value: s.workingHours },
    { icon: IconPin, label: "Хаяг", value: s.address },
  ];
  return (
    <>
      <PageHeader title="Холбоо барих">
        <Breadcrumbs items={[{ label: "Холбоо барих" }]} />
      </PageHeader>
      <div className="container-x py-10">
        <p className="mb-8 max-w-2xl text-muted">
          Захиалга, бараа, хүргэлтийн талаар асуух зүйл байвал доорх сувгаар холбогдоорой. Бид ажлын цагаар аль болох хурдан хариулна.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, label, value, href, note, external }) => {
            const body = (
              <>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon width={24} height={24} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-muted">{label}</p>
                  <p className="break-words text-lg font-bold text-ink">{value}</p>
                  {note && <p className="text-xs text-brand-600">{note}</p>}
                </div>
              </>
            );
            return href ? (
              <a
                key={label}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="card flex items-center gap-4 p-5 transition hover:border-brand-300 hover:shadow-md"
              >
                {body}
              </a>
            ) : (
              <div key={label} className="card flex items-center gap-4 p-5">
                {body}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
