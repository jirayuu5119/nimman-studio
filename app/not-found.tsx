import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] p-6 text-stone-900">
      <section className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-stone-400">404</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold">ไม่พบหน้าที่ต้องการ</h1>
        <p className="mt-4 text-sm leading-7 text-stone-500">
          ลิงก์อาจหมดอายุหรือถูกย้าย กรุณากลับไปเริ่มจากหน้าแรก
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
        >
          กลับหน้าแรก
        </Link>
      </section>
    </main>
  );
}
