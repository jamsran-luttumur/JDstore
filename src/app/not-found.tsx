import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="space-y-4">
        <p className="text-6xl font-black text-brand-600">404</p>
        <h1 className="text-2xl font-bold">Хуудас олдсонгүй</h1>
        <Link href="/" className="btn-primary">Нүүр хуудас руу буцах</Link>
      </div>
    </div>
  );
}
