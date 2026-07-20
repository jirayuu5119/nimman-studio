"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { changeAdminPassword } from "@/app/admin/actions";
import { validatePasswordConfirmation } from "@/lib/admin-form-state";
import { getPasswordPolicyMessage } from "@/lib/auth/password-policy";

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setMessage("");
    setError("");

    const validationError = validatePasswordConfirmation(
      password,
      confirmPassword
    );
    if (validationError) {
      setError(
        validationError === "mismatch"
          ? "รหัสผ่านทั้งสองช่องไม่ตรงกัน"
          : getPasswordPolicyMessage(validationError)
      );
      return;
    }

    setLoading(true);
    try {
      const result = await changeAdminPassword(password);
      setPassword("");
      setConfirmPassword("");
      setMessage(
        result.auditRecorded
          ? "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว"
          : "เปลี่ยนรหัสผ่านแล้ว แต่บันทึก audit log ไม่สำเร็จ กรุณาแจ้งผู้ดูแลระบบ"
      );
    } catch {
      setError("เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-panel p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-sidebar)] text-white">
          <KeyRound aria-hidden="true" size={19} />
        </span>
        <div>
          <p className="text-xs font-medium text-[var(--admin-accent)]">ความปลอดภัย</p>
          <h2 className="mt-1 text-lg font-bold">เปลี่ยนรหัสผ่านแอดมิน</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
            ใช้ 12–128 ตัวอักษร พร้อมตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และสัญลักษณ์
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="admin-new-password" className="block text-sm font-medium">
          รหัสผ่านใหม่
          <span className="mt-1.5 flex rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] focus-within:bg-white">
            <input
              id="admin-new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="อย่างน้อย 12 ตัวอักษร"
              className="min-h-11 min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              onClick={() => setShowPassword((visible) => !visible)}
              className="admin-focus inline-flex size-11 items-center justify-center text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
            >
              {showPassword ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
            </button>
          </span>
        </label>

        <label htmlFor="admin-confirm-password" className="block text-sm font-medium">
          ยืนยันรหัสผ่านใหม่
          <input
            id="admin-confirm-password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="กรอกซ้ำอีกครั้ง"
            className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3.5 text-sm outline-none focus:bg-white"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="admin-focus inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--admin-sidebar)] px-4 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-55"
        >
          {loading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
        </button>
      </form>

      <p
        aria-live="polite"
        className={`mt-3 min-h-5 text-sm ${
          error ? "text-red-700" : "text-emerald-700"
        }`}
      >
        {error || message}
      </p>
    </div>
  );
}
