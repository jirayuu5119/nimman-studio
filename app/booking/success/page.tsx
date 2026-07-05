"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Home,
  CalendarDays,
} from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();

  const bookingNo =
    searchParams.get("bookingNo") ?? "-";

  return (
    <main className="min-h-screen bg-[#F7F4EF] py-10">
      <div className="mx-auto max-w-3xl px-5">
        <div className="rounded-3xl bg-white p-10 shadow-xl text-center">
          <div className="flex justify-center">
            <CheckCircle2
              size={90}
              className="text-green-600"
            />
          </div>

          <h1 className="mt-6 text-4xl font-bold text-[#4B3525]">
            จองคิวสำเร็จ
          </h1>

          <p className="mt-4 text-lg text-stone-600">
            เราได้รับข้อมูลการจองของคุณเรียบร้อยแล้ว
          </p>

          <div className="mt-10 rounded-2xl border border-green-200 bg-green-50 p-6">
            <div className="text-sm text-stone-500">
              Booking Number
            </div>

            <div className="mt-2 text-3xl font-bold tracking-wider text-green-700">
              {bookingNo}
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-stone-50 p-6 text-left">
            <h2 className="font-bold text-xl text-[#4B3525]">
              ขั้นตอนถัดไป
            </h2>

            <ul className="mt-4 space-y-3 text-stone-600">
              <li>✅ ทีมงานจะตรวจสอบสลิปการโอนเงิน</li>

              <li>
                ✅ เมื่อยืนยันแล้ว สถานะการจองจะเปลี่ยนเป็น
                <span className="font-semibold text-green-700">
                  {" "}
                  Confirmed
                </span>
              </li>

              <li>
                ✅ หากมีข้อมูลเพิ่มเติม
                ทีมงานจะติดต่อกลับตามเบอร์โทรหรือ Line
              </li>
            </ul>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl border py-4 font-bold transition hover:bg-stone-100"
            >
              <Home size={20} />
              กลับหน้าแรก
            </Link>

            <Link
              href="/booking"
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-700 py-4 font-bold text-white transition hover:bg-amber-800"
            >
              <CalendarDays size={20} />
              จองใหม่
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}