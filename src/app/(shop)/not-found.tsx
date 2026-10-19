import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x grid place-items-center py-24 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-6xl font-black text-brand-600">404</p>
        <h1 className="text-2xl font-bold">Хуудас олдсонгүй</h1>
        <p className="text-muted">Таны хайсан хуудас устсан эсвэл хаяг буруу байна.</p>
        <div className="flex justify-center gap-3">
          <Link href="/" className="btn-primary">Нүүр хуудас</Link>
          <Link href="/products" className="btn-outline">Бүх бараа</Link>
        </div>
      </div>
    </div>
  );
}
