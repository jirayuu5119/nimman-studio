"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { changeAdminPassword } from "@/app/admin/actions";

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (password.length < 12) {
      setError("รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      setLoading(false);
      return;
    }

    try {
      await changeAdminPassword(password);
    } catch {
      setError("เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง");
      setLoading(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
    setLoading(false);
  }

  return (
    <div className="mb-8 rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white">
          <KeyRound size={20} />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
            ความปลอดภัย
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-900">
            เปลี่ยนรหัสผ่านแอดมิน
          </h2>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            รหัสผ่านใหม่
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="อย่างน้อย 12 ตัวอักษร"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            ยืนยันรหัสผ่านใหม่
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="กรอกซ้ำอีกครั้ง"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-7 inline-flex h-[46px] items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
        </button>
      </form>

      {(message || error) && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || message}
        </div>
      )}
    </div>
  );
}
