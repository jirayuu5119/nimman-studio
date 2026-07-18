"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createFreshClient } from "@/lib/supabase/client";
import { isStaleSessionError } from "@/lib/auth/session-recovery";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    async function clearLocalSession() {
      await fetch("/api/auth/session", {
        method: "DELETE",
        cache: "no-store",
        credentials: "same-origin",
      });
    }

    try {
      await clearLocalSession();
    } catch {
      // A fresh non-singleton client below can still complete a password login.
    }

    let result = await createFreshClient().auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (isStaleSessionError(result.error)) {
      try {
        await clearLocalSession();
      } catch {
        // The retry will return the actionable Auth error if cleanup failed.
      }
      result = await createFreshClient().auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
    }

    const { error } = result;

    if (error) {
      if (error.code === "over_request_rate_limit") {
        setError("ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่");
      } else if (isStaleSessionError(error)) {
        setError("เซสชันบนอุปกรณ์หมดอายุ กรุณารีเฟรชหน้าแล้วลองอีกครั้ง");
      } else {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
      setLoading(false);
      return;
    }

    router.replace("/login/mfa");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="mb-2 text-3xl font-bold">
          Admin Login
        </h1>

        <p className="mb-6 text-sm text-gray-500">
          เข้าสู่ระบบจัดการ Nimman Foto
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Link
          href="/login/forgot-password"
          className="mb-6 block text-right text-sm font-medium text-gray-600 underline-offset-4 hover:underline"
        >
          ลืมรหัสผ่าน?
        </Link>

        <button
          disabled={loading}
          className="w-full rounded-xl bg-black py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </main>
  );
}
