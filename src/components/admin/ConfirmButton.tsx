"use client";

import { useFormStatus } from "react-dom";

export function ConfirmButton({ message, className, children, form }: { message: string; className?: string; children: React.ReactNode; form?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      form={form}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {pending ? "..." : children}
    </button>
  );
}
