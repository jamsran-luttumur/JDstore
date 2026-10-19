import { AdminHeader } from "@/components/admin/ui";
import { qpayMode } from "@/lib/qpay";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Тохиргоо" };

export default async function SettingsPage() {
  const settings = await getSettings();
  const mode = qpayMode();
  const smtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  return (
    <>
      <AdminHeader title="Тохиргоо" />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-4 text-sm">
          <p className="text-muted">QPay горим</p>
          <p className={`font-bold ${mode === "production" ? "text-emerald-700" : "text-amber-700"}`}>{mode}{process.env.QPAY_ENABLED === "false" ? " (унтраастай)" : ""}</p>
        </div>
        <div className="card p-4 text-sm">
          <p className="text-muted">И-мэйл (SMTP)</p>
          <p className={`font-bold ${smtp ? "text-emerald-700" : "text-amber-700"}`}>{smtp ? "Тохируулсан" : "Тохируулаагүй — .env-д SMTP_* оруулна уу"}</p>
        </div>
        <div className="card p-4 text-sm">
          <p className="text-muted">Зураг хадгалалт</p>
          <p className="font-bold">{process.env.BLOB_READ_WRITE_TOKEN ? "Vercel Blob" : "Локал ./uploads"}</p>
        </div>
      </div>
      <SettingsForm settings={settings} />
    </>
  );
}
