"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        event: "app_error_boundary",
        digest: error.digest ?? "unknown",
      })
    );
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] p-6 text-stone-900">
      <section className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-red-500">Error</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold">ระบบขัดข้องชั่วคราว</h1>
        <p className="mt-4 text-sm leading-7 text-stone-500">
          กรุณาลองอีกครั้ง หากยังพบปัญหาโปรดติดต่อ Nimman Foto
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
        >
          ลองอีกครั้ง
        </button>
      </section>
    </main>
  );
}
