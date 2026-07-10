"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Copy,
  Home,
  Loader2,
  MessageCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import BookingConfirmationSection from "@/components/BookingConfirmationSection";
import type { BookingConfirmationData } from "@/types/booking";

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingNo = searchParams.get("bookingNo") ?? "";
  const token = searchParams.get("token") ?? "";
  const [booking, setBooking] = useState<BookingConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!bookingNo || !token) {
      setError("ลิงก์ตรวจสอบการจองไม่ครบถ้วน");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const params = new URLSearchParams({ bookingNo, token });
      const response = await fetch(`/api/bookings/status?${params.toString()}`, {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "ตรวจสอบสถานะการจองไม่สำเร็จ");
      }

      setBooking(result.booking as BookingConfirmationData);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "ตรวจสอบสถานะการจองไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  }, [bookingNo, token]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadBooking(), 0);
    const interval = window.setInterval(() => void loadBooking(), 30000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadBooking]);

  const copyBookingNo = async () => {
    if (!bookingNo) return;
    await navigator.clipboard.writeText(bookingNo);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const isConfirmed = booking?.status === "confirmed";
  const isCancelled = booking?.status === "cancelled";

  return (
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-stone-900 md:py-12">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.06)] md:p-10">
          <div
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border ${
              isConfirmed
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : isCancelled
                ? "border-rose-100 bg-rose-50 text-rose-600"
                : "border-amber-100 bg-amber-50 text-amber-600"
            }`}
          >
            {loading ? (
              <Loader2 size={46} className="animate-spin" />
            ) : isConfirmed ? (
              <BadgeCheck size={52} />
            ) : isCancelled ? (
              <XCircle size={52} />
            ) : (
              <Clock3 size={50} />
            )}
          </div>

          <p className="mt-8 text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
            Booking Status
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
            {loading
              ? "กำลังตรวจสอบสถานะ"
              : error
              ? "ตรวจสอบรายการไม่ได้"
              : isConfirmed
              ? "การจองได้รับการยืนยันแล้ว"
              : isCancelled
              ? "รายการจองถูกยกเลิก"
              : booking?.status === "completed"
              ? "การถ่ายภาพเสร็จสิ้นแล้ว"
              : "ได้รับข้อมูลการจองแล้ว"}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-500 md:text-base">
            {error
              ? error
              : isConfirmed
              ? "คิวถ่ายภาพของคุณได้รับการยืนยันเรียบร้อยแล้ว ดาวน์โหลดใบยืนยันได้ด้านล่าง"
              : isCancelled
              ? "หากต้องการสอบถามรายละเอียด กรุณาติดต่อช่างภาพโดยตรง"
              : booking?.status === "completed"
              ? "ขอบคุณที่ไว้วางใจให้ Nimman Foto บันทึกวันสำคัญของคุณ"
              : "ได้รับหลักฐานการชำระเงินแล้ว กรุณารอช่างภาพตรวจสอบและยืนยันการจอง"}
          </p>

          {!loading &&
            !error &&
            booking &&
            !isConfirmed &&
            !isCancelled &&
            booking.status !== "completed" && (
              <p className="mx-auto mt-6 max-w-xl border-t border-stone-200 pt-5 text-sm leading-7 text-stone-600">
                โปรดแคปหน้าจอเลขที่การจอง และ save เบอร์โทรศัพท์ไว้
                สามารถตรวจสอบสถานะการจองได้ที่หน้าจองคิว
              </p>
            )}

          {bookingNo && (
            <div className="mx-auto mt-9 max-w-xl rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5">
              <div className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                เลขที่การจอง
              </div>
              <div className="mt-3 break-words font-serif text-3xl font-semibold tracking-wide text-stone-900 md:text-4xl">
                {bookingNo}
              </div>
              <button
                type="button"
                onClick={copyBookingNo}
                className="mx-auto mt-5 inline-flex min-h-12 items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
              >
                <Copy size={16} />
                {copied ? "คัดลอกแล้ว" : "คัดลอกเลขจอง"}
              </button>
            </div>
          )}

          {!loading && !error && !isConfirmed && !isCancelled && (
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadBooking();
              }}
              className="mx-auto mt-6 inline-flex min-h-12 items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
            >
              <RefreshCw size={17} />
              ตรวจสอบสถานะอีกครั้ง
            </button>
          )}
        </section>

        {isConfirmed && booking && (
          <BookingConfirmationSection booking={booking} />
        )}

        <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          <Link
            href="/"
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-4 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
          >
            <Home size={18} />
            กลับหน้าแรก
          </Link>
          <a
            href="https://line.me/ti/p/tEgkF7b0Vg"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-4 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
          >
            <MessageCircle size={18} />
            ติดต่อส่วนตัวผ่าน LINE
          </a>
          <Link
            href="/booking"
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-stone-900"
          >
            <CalendarDays size={18} />
            จองใหม่
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f8f5f0] px-5 py-10">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-stone-200 bg-white p-10 text-center text-stone-500">
            กำลังโหลดสถานะการจอง...
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
