"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Copy, CreditCard } from "lucide-react";
import { useBooking } from "@/context/BookingContext";

export default function BookingPaymentPage() {
  const router = useRouter();
  const { booking } = useBooking();

  const [copied, setCopied] = useState(false);

  const realPromptPayNumber = "8302376723";

  const copyPromptPay = async () => {
    await navigator.clipboard.writeText(realPromptPayNumber);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  return (
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-stone-900 md:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
            Step 04
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
            ชำระเงินมัดจำ
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-500 md:text-base">
            สแกน QR Code หรือคัดลอกเลขพร้อมเพย์
            <br className="hidden md:block" />
            จากนั้นอัปโหลดสลิปเพื่อยืนยันการจอง
          </p>
        </div>

        <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1fr]">
            <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5 md:p-6">
              <div className="mb-5 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                  PromptPay QR
                </p>

                <h2 className="mt-2 text-xl font-semibold text-stone-900">
                  สแกนเพื่อชำระเงิน
                </h2>
              </div>

              <div className="mx-auto max-w-[320px] rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
                <Image
                  src="/promptpay-qr.png"
                  alt="PromptPay QR"
                  width={320}
                  height={320}
                  priority
                  className="h-auto w-full rounded-xl"
                />
              </div>
            </section>

            <section className="space-y-5">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                      PromptPay
                    </p>

                    <div className="mt-3 font-serif text-3xl font-semibold tracking-wide text-stone-900">
                      {realPromptPayNumber}
                    </div>

                    <p className="mt-2 text-sm text-stone-500">
                      กดคัดลอกเลขพร้อมเพย์ หรือสแกน QR Code
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyPromptPay}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${
                      copied
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-stone-300 bg-white text-stone-700 hover:border-stone-900"
                    }`}
                  >
                    {copied ? <Check size={17} /> : <Copy size={17} />}
                    {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                  </button>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-900 p-5 text-white md:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <CreditCard size={22} />
                  </div>

                  <div>
                    <p className="text-sm text-stone-300">
                      ยอดที่ต้องชำระ
                    </p>

                    <div className="mt-2 font-serif text-4xl font-semibold">
                      {booking.totalPrice.toLocaleString()} บาท
                    </div>

                    <p className="mt-3 text-sm leading-6 text-stone-300">
                      หลังชำระเงินแล้ว กรุณาอัปโหลดสลิปในขั้นตอนถัดไป
                      เพื่อให้ระบบบันทึกการจอง
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5">
                <h3 className="text-sm font-semibold text-stone-900">
                  หมายเหตุ
                </h3>

                <p className="mt-2 text-sm leading-6 text-stone-500">
                  กรุณาตรวจสอบยอดโอนให้ถูกต้อง และเก็บสลิปไว้สำหรับอัปโหลดยืนยันการจอง
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-stone-300 bg-white px-6 py-4 text-sm font-semibold tracking-[0.12em] text-stone-700 transition hover:border-stone-900"
            >
              ← ย้อนกลับ
            </button>

            <button
              onClick={() => router.push("/booking/upload-slip")}
              className="rounded-full border border-stone-900 bg-stone-900 px-6 py-4 text-sm font-semibold tracking-[0.12em] text-white transition hover:bg-white hover:text-stone-900"
            >
              อัปโหลดสลิป →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}