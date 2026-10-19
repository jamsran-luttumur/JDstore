import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { getAdminSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Нэвтрэх" };

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="card w-full max-w-sm space-y-6 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-2">
          <Logo />
          <p className="text-sm text-muted">Админ самбарт нэвтрэх</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
