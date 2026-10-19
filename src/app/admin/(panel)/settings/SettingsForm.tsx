"use client";

import { useActionState } from "react";
import { changePasswordAction, saveSettingsAction } from "@/app/admin/actions";
import type { StoreSettings } from "@/lib/settings";

const groups: { title: string; fields: { key: keyof StoreSettings; label: string; type?: string; hint?: string }[] }[] = [
  {
    title: "Холбоо барих",
    fields: [
      { key: "contactPhone", label: "Утас", type: "tel" },
      { key: "contactEmail", label: "И-мэйл", type: "email" },
      { key: "facebookName", label: "Facebook хуудасны нэр" },
      { key: "facebookUrl", label: "Facebook холбоос", type: "url" },
      { key: "address", label: "Хаяг" },
      { key: "workingHours", label: "Ажлын цаг" },
      { key: "notifyEmail", label: "Шинэ захиалгын мэдэгдэл авах и-мэйл", type: "email" },
    ],
  },
  {
    title: "Дансны мэдээлэл (Дансаар шилжүүлэх)",
    fields: [
      { key: "bankName", label: "Банк" },
      { key: "bankAccount", label: "Дансны дугаар" },
      { key: "bankHolder", label: "Хүлээн авагчийн нэр" },
      { key: "bankIban", label: "IBAN (заавал биш)" },
    ],
  },
  {
    title: "Хүргэлт (₮)",
    fields: [
      { key: "shippingFeeUB", label: "Улаанбаатар", hint: "Хүргэлтийн төлбөр" },
      { key: "shippingFeeRural", label: "Орон нутаг" },
      { key: "freeShippingThreshold", label: "Үнэгүй хүргэлтийн босго", hint: "0 бол үнэгүй хүргэлтгүй" },
    ],
  },
];

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, undefined);
  const [pw, pwAction, pwPending] = useActionState(changePasswordAction, undefined);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <form action={action} className="space-y-6">
        {groups.map((g) => (
          <section key={g.title} className="card p-5">
            <h2 className="mb-4 font-bold">{g.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {g.fields.map((f) => (
                <div key={f.key}>
                  <label htmlFor={f.key} className="label">{f.label}</label>
                  <input id={f.key} name={f.key} type={f.type ?? "text"} defaultValue={String(settings[f.key])} className="input" aria-invalid={!!state?.fields?.[f.key]} />
                  {state?.fields?.[f.key] ? <p className="mt-1 text-sm text-rose-600">{state.fields[f.key]}</p> : f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={pending}>{pending ? "Хадгалж байна..." : "Хадгалах"}</button>
          {state?.error && <span className="text-sm text-rose-600">{state.error}</span>}
          {state?.ok && <span className="text-sm text-emerald-700">{state.message}</span>}
        </div>
      </form>

      <form action={pwAction} className="card h-fit space-y-4 p-5">
        <h2 className="font-bold">Нууц үг солих</h2>
        <div><label className="label" htmlFor="current">Одоогийн нууц үг</label><input id="current" name="current" type="password" required autoComplete="current-password" className="input" /></div>
        <div><label className="label" htmlFor="next">Шинэ нууц үг (10+ тэмдэгт)</label><input id="next" name="next" type="password" required minLength={10} autoComplete="new-password" className="input" /></div>
        <div><label className="label" htmlFor="confirm">Шинэ нууц үг давтах</label><input id="confirm" name="confirm" type="password" required minLength={10} autoComplete="new-password" className="input" /></div>
        {pw?.error && <p className="text-sm text-rose-600">{pw.error}</p>}
        {pw?.ok && <p className="text-sm text-emerald-700">{pw.message}</p>}
        <button className="btn-outline w-full" disabled={pwPending}>Солих</button>
      </form>
    </div>
  );
}
