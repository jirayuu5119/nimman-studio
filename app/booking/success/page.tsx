"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Home,
  CalendarDays,
  Copy,
} from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingNo = searchParams.get("bookingNo") ?? "-";

  const copyBookingNo = async () => {
    await navigator.clipboard.writeText(bookingNo);
    alert("คัดลอก Booking Number แล้ว");
  };

  return (
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-stone-900 md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-10">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={54} />
          </div>

          <p className="mt-8 text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
            Booking Completed
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
            จองคิวสำเร็จ
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-stone-500 md:text-base">
            เราได้รับข้อมูลการจองของคุณเรียบร้อยแล้ว
            ทีมงานจะตรวจสอบสลิปและติดต่อกลับเพื่อยืนยันอีกครั้ง
          </p>

          <div className="mt-10 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5">
            <div className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
              Booking Number
            </div>

            <div className="mt-3 font-serif text-3xl font-semibold tracking-wide text-stone-900 md:text-4xl">
              {bookingNo}
            </div>

            <button
              type="button"
              onClick={copyBookingNo}
              className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
            >
              <Copy size={16} />
              คัดลอกเลขจอง
            </button>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-stone-200 bg-white p-5 text-left md:p-6">
            <h2 className="text-lg font-semibold text-stone-900">
              ขั้นตอนถัดไป
            </h2>

            <div className="mt-5 space-y-4">
              <StepItem
                number="01"
                text="ทีมงานจะตรวจสอบสลิปการโอนเงิน"
              />

              <StepItem
                number="02"
                text="เมื่อยืนยันแล้ว สถานะการจองจะเปลี่ยนเป็น Confirmed"
              />

              <StepItem
                number="03"
                text="หากต้องการข้อมูลเพิ่มเติม ทีมงานจะติดต่อกลับตามเบอร์โทรหรือ Line"
              />
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-4 text-sm font-semibold tracking-[0.12em] text-stone-700 transition hover:border-stone-900"
            >
              <Home size={18} />
              กลับหน้าแรก
            </Link>

            <Link
              href="/booking"
              className="flex items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-6 py-4 text-sm font-semibold tracking-[0.12em] text-white transition hover:bg-white hover:text-stone-900"
            >
              <CalendarDays size={18} />
              จองใหม่
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function StepItem({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-xs font-semibold text-stone-500">
        {number}
      </div>

      <p className="text-sm leading-6 text-stone-600">
        {text}
      </p>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f8f5f0] px-5 py-10">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-stone-200 bg-white p-10 text-center text-stone-500">
            Loading...
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}