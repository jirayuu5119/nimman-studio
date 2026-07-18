"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getPasswordPolicyMessage,
  validateAdminPassword,
} from "@/lib/auth/password-policy";
import { createClient } from "@/lib/supabase/client";

type PageState = "checking" | "ready" | "invalid" | "success";

export default function UpdatePasswordPage() {
  const [pageState, setPageState] = useState<PageState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function verifyRecoverySession() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const hashParams = new URLSearchParams(url.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const authError = hashParams.get("error_code");

      if (accessToken && refreshToken) {
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
        const { error: recoveryError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (recoveryError) {
          if (active) setPageState("invalid");
          return;
        }
      } else if (authError) {
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
        if (active) setPageState("invalid");
        return;
      }

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        url.searchParams.delete("code");
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
        if (exchangeError) {
          if (active) setPageState("invalid");
          return;
        }
      }

      const { data, error: userError } = await supabase.auth.getUser();
      if (!active) return;
      setPageState(userError || !data.user ? "invalid" : "ready");
    }

    void verifyRecoverySession();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const policyError = validateAdminPassword(password);
    if (policyError) {
      setError(getPasswordPolicyMessage(policyError));
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาขอลิงก์รีเซ็ตใหม่");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut({ scope: "global" });
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
        cache: "no-store",
        credentials: "same-origin",
      });
    } catch {
      // Supabase signOut already revoked the session; this only clears leftovers.
    }

    setPassword("");
    setConfirmPassword("");
    setPageState("success");
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {pageState === "checking" && (
          <p className="text-center text-sm text-gray-500" aria-live="polite">
            กำลังตรวจสอบลิงก์รีเซ็ต...
          </p>
        )}

        {pageState === "invalid" && (
          <div className="text-center">
            <h1 className="text-2xl font-bold">ลิงก์ใช้ไม่ได้</h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หมดอายุ หรือถูกใช้ไปแล้ว
            </p>
            <Link
              href="/login/forgot-password"
              className="mt-6 block rounded-xl bg-black py-3 font-semibold text-white"
            >
              ขอลิงก์ใหม่
            </Link>
          </div>
        )}

        {pageState === "success" && (
          <div className="text-center" aria-live="polite">
            <h1 className="text-2xl font-bold">ตั้งรหัสผ่านเรียบร้อยแล้ว</h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Session เก่าถูกยกเลิกแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
            </p>
            <Link
              href="/login"
              className="mt-6 block rounded-xl bg-black py-3 font-semibold text-white"
            >
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        )}

        {pageState === "ready" && (
          <>
            <h1 className="text-3xl font-bold">ตั้งรหัสผ่านใหม่</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              ใช้อย่างน้อย 12 ตัว และมีพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์
            </p>

            <form onSubmit={handleSubmit} className="mt-6">
              {error && (
                <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <label htmlFor="new-password" className="mb-1 block text-sm font-medium">
                รหัสผ่านใหม่
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
                autoFocus
              />

              <label htmlFor="confirm-password" className="mb-1 mt-4 block text-sm font-medium">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-black py-3 font-semibold text-white disabled:opacity-60"
              >
                {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
