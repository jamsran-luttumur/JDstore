"use client";

import { useActionState } from "react";
import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { updateOrderStatusAction } from "../../../actions";

export function StatusForm({ id, status }: { id: string; status: OrderStatus }) {
  const [state, action, pending] = useActionState(updateOrderStatusAction, undefined);
  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(e) => {
        const next = new FormData(e.currentTarget).get("status");
        if (next === "CANCELLED" && !confirm("Захиалгыг цуцлах уу? Барааны үлдэгдэл буцаж нэмэгдэнэ.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <label htmlFor="status" className="label">Төлөв өөрчлөх</label>
      <div className="flex gap-2">
        <select id="status" name="status" defaultValue={status} className="input">
          {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
          ))}
        </select>
        <button className="btn-primary shrink-0" disabled={pending}>{pending ? "..." : "Хадгалах"}</button>
      </div>
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-700">{state.message}</p>}
    </form>
  );
}
