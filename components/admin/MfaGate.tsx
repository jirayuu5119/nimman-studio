"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "loading" | "setup" | "enroll" | "challenge";

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

function qrCodeSource(value: string) {
  return value.startsWith("data:")
    ? value
    : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`;
}

export default function MfaGate() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState("");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error: factorsError } =
        await supabase.auth.mfa.listFactors();
      if (!active) return;
      if (factorsError) {
        setError("โหลดข้อมูล MFA ไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่");
        setMode("setup");
        return;
      }

      const verifiedTotp = data.totp[0];
      if (verifiedTotp) {
        setFactorId(verifiedTotp.id);
        setMode("challenge");
      } else {
        setMode("setup");
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function beginEnrollment() {
    setBusy(true);
    setError("");
    try {
      const listed = await supabase.auth.mfa.listFactors();
      if (listed.error) throw listed.error;

      for (const factor of listed.data.all) {
        if (factor.factor_type === "totp" && factor.status === "unverified") {
          const { error: unenrollError } = await supabase.auth.mfa.unenroll({
            factorId: factor.id,
          });
          if (unenrollError) throw unenrollError;
        }
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Nimman Foto Admin",
        issuer: "Nimman Foto",
      });
      if (enrollError) throw enrollError;

      const nextEnrollment = {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      };
      setEnrollment(nextEnrollment);
      setFactorId(data.id);
      setMode("enroll");
    } catch {
      setError("เริ่มตั้งค่า MFA ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!/^\d{6}$/.test(code) || !factorId) {
      setError("กรุณากรอกรหัส 6 หลักจากแอป Authenticator");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { error: verifyError } =
        await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (verifyError) throw verifyError;
      await supabase.auth.refreshSession();
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("รหัสไม่ถูกต้องหรือหมดอายุ กรุณาลองรหัสล่าสุดอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] p-6 text-stone-900">
      <section className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-7 shadow-[0_20px_80px_rgba(0,0,0,0.08)] md:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white">
          <ShieldCheck size={28} />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-semibold">
          ยืนยันตัวตนสองขั้นตอน
        </h1>
        <p className="mt-3 text-sm leading-7 text-stone-500">
          บัญชีผู้ดูแลต้องยืนยันด้วยแอป Authenticator ก่อนเข้าถึงข้อมูลการจอง
        </p>

        {error && (
          <div role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {mode === "loading" && (
          <div className="mt-8 flex items-center gap-3 text-sm text-stone-500">
            <Loader2 className="animate-spin" size={18} />
            กำลังตรวจสอบอุปกรณ์ MFA...
          </div>
        )}

        {mode === "setup" && (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <h2 className="font-semibold">ตั้งค่า Authenticator ครั้งแรก</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              ใช้ Google Authenticator, Microsoft Authenticator หรือแอป TOTP อื่นที่เชื่อถือได้
            </p>
            <button
              type="button"
              onClick={beginEnrollment}
              disabled={busy}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />}
              เริ่มตั้งค่า MFA
            </button>
          </div>
        )}

        {mode === "enroll" && enrollment && (
          <div className="mt-7">
            <div className="mx-auto w-fit rounded-2xl border border-stone-200 bg-white p-3">
              <Image
                src={qrCodeSource(enrollment.qrCode)}
                alt="QR สำหรับตั้งค่าแอป Authenticator"
                width={220}
                height={220}
                unoptimized
              />
            </div>
            <p className="mt-4 text-center text-xs text-stone-500">
              หากสแกนไม่ได้ ให้กรอกรหัสนี้ในแอป
            </p>
            <code className="mt-2 block break-all rounded-xl bg-stone-100 p-3 text-center text-sm">
              {enrollment.secret}
            </code>
          </div>
        )}

        {(mode === "enroll" || mode === "challenge") && (
          <div className="mt-7">
            <label htmlFor="mfa-code" className="block text-sm font-medium">
              รหัส 6 หลักจาก Authenticator
            </label>
            <input
              id="mfa-code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(event) => {
                if (event.key === "Enter") verify();
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              autoFocus={mode === "challenge"}
              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-4 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:border-stone-900"
            />
            <button
              type="button"
              onClick={verify}
              disabled={busy || code.length !== 6}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy && <Loader2 className="animate-spin" size={17} />}
              ยืนยันและเข้าสู่ระบบ
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900"
        >
          <LogOut size={16} />
          ออกจากระบบ
        </button>
      </section>
    </main>
  );
}
