import { deleteBannerAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { AdminHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { BannerForm } from "./BannerForm";

export const metadata = { title: "Баннер" };

export default async function BannersPage() {
  const banners = await prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <AdminHeader title="Нүүр хуудасны баннер" />
      <p className="mb-4 text-sm text-muted">Зөвлөмж: 1920×720 хэмжээтэй өргөн зураг. Текстийг зурган дээр бичих шаардлагагүй — гарчиг автоматаар давхарлана.</p>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Шинэ баннер</h2>
      <BannerForm key={`new-${banners.length}`} banner={{ title: "", subtitle: "", imageUrl: "", linkUrl: "", sortOrder: banners.length + 1, isActive: true }} />
      <h2 className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-muted">Одоо байгаа ({banners.length})</h2>
      <div className="space-y-4">
        {banners.map((b) => (
          <BannerForm key={b.id + b.updatedAt.getTime()} banner={b}>
            <ConfirmButton form={`del-${b.id}`} message="Баннерыг устгах уу?" className="btn-outline text-rose-600">Устгах</ConfirmButton>
          </BannerForm>
        ))}
      </div>
      {banners.map((b) => (
        <form key={b.id} id={`del-${b.id}`} action={deleteBannerAction} className="hidden">
          <input type="hidden" name="id" value={b.id} />
        </form>
      ))}
    </>
  );
}
