"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, CreditCard } from "lucide-react";

import { useBooking } from "@/context/BookingContext";

export default function BookingPaymentPage() {
  const router = useRouter();
  const { booking } = useBooking();

  const promptPayNumber = "0812345678";

  const copyPromptPay = async () => {
    await navigator.clipboard.writeText(promptPayNumber);
    alert("คัดลอกเลข PromptPay แล้ว");
  };

  return (
    <main className="min-h-screen bg-[#F7F4EF] py-10">
      <div className="mx-auto max-w-3xl px-5">
        <div className="rounded-3xl bg-white p-10 shadow-xl">

          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#4B3525]">
              ชำระเงินมัดจำ
            </h1>

            <p className="mt-2 text-stone-500">
              ขั้นตอนที่ 4 จาก 5
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <div className="rounded-2xl border bg-white p-5 shadow">

              <Image
                src="/images/promptpay-qr.png"
                alt="PromptPay QR"
                width={320}
                height={320}
                priority
              />

            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-stone-50 p-6">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-sm text-stone-500">
                  PromptPay
                </div>

                <div className="mt-2 text-2xl font-bold tracking-wider">
                  {promptPayNumber}
                </div>

              </div>

              <button
                onClick={copyPromptPay}
                className="flex items-center gap-2 rounded-xl border px-5 py-3 transition hover:bg-white"
              >
                <Copy size={18} />
                คัดลอก
              </button>

            </div>

          </div>

          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">

            <div className="flex items-center gap-4">

              <CreditCard
                size={32}
                className="text-amber-700"
              />

              <div>

                <div className="text-stone-600">
                  ยอดที่ต้องชำระ
                </div>

                <div className="text-4xl font-bold text-amber-700">
                  {booking.totalPrice.toLocaleString()} บาท
                </div>

              </div>

            </div>

          </div>

          <div className="mt-10 flex gap-4">

            <button
              onClick={() => router.back()}
              className="flex-1 rounded-xl border py-4 text-lg font-bold transition hover:bg-stone-100"
            >
              ← ย้อนกลับ
            </button>

            <button
              onClick={() =>
                router.push("/booking/upload-slip")
              }
              className="flex-1 rounded-xl bg-amber-700 py-4 text-lg font-bold text-white transition hover:bg-amber-800"
            >
              อัปโหลดสลิป →
            </button>

          </div>

        </div>
      </div>
    </main>
  );
}