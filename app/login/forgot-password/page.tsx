"use client";

import Link from "next/link";
import { useState } from "react";
import { createPasswordRecoveryClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const redirectTo = `${window.location.origin}/login/update-password`;
    const { error: resetError } = await createPasswordRecoveryClient().auth
      .resetPasswordForEmail(normalizedEmail, { redirectTo });

    if (resetError) {
      setError(
        resetError.code === "over_email_send_rate_limit"
          ? "ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่"
          : "ส่งอีเมลรีเซ็ตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold">ลืมรหัสผ่าน</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          กรอกอีเมลผู้ดูแลระบบ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่
        </p>

        {sent ? (
          <div className="mt-6" aria-live="polite">
            <div className="rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
              หากอีเมลนี้มีบัญชีอยู่ ระบบได้ส่งลิงก์รีเซ็ตแล้ว กรุณาตรวจกล่องจดหมายและโฟลเดอร์สแปม
            </div>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setError("");
              }}
              className="mt-4 w-full rounded-xl border border-gray-300 py-3 text-sm font-semibold"
            >
              ส่งลิงก์อีกครั้ง
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6">
            {error && (
              <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <label htmlFor="recovery-email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              required
              autoFocus
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-black py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 block text-center text-sm font-medium text-gray-600 underline-offset-4 hover:underline"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </section>
    </main>
  );
}
