"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, SearchCheck } from "lucide-react";

export default function BookingStatusLookupPage() {
  const router = useRouter();
  const [bookingNo, setBookingNo] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingNo, phone }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "ตรวจสอบสถานะการจองไม่สำเร็จ"
        );
      }

      const params = new URLSearchParams({
        bookingNo: result.bookingNo,
        token: result.accessToken,
      });
      router.push(`/booking/success?${params.toString()}`);
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "ตรวจสอบสถานะการจองไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-stone-900 md:py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
            Booking Status
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
            ตรวจสอบสถานะการจอง
          </h1>
          <p className="mt-4 text-sm leading-7 text-stone-500">
            กรอกข้อมูลเดียวกับที่ใช้จองคิว
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.06)] md:p-10"
        >
          <div>
            <label
              htmlFor="booking-no"
              className="text-sm font-semibold text-stone-800"
            >
              เลขที่การจอง
            </label>
            <input
              id="booking-no"
              type="text"
              value={bookingNo}
              onChange={(event) =>
                setBookingNo(event.target.value.toUpperCase())
              }
              placeholder="NF-20260710-0001"
              autoComplete="off"
              maxLength={24}
              required
              className="mt-3 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 font-mono text-base uppercase text-stone-900 outline-none transition placeholder:text-stone-300 focus:border-stone-900"
            />
          </div>

          <div className="mt-6">
            <label
              htmlFor="booking-phone"
              className="text-sm font-semibold text-stone-800"
            >
              เบอร์โทรศัพท์ที่ใช้จอง
            </label>
            <input
              id="booking-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="08X-XXX-XXXX"
              autoComplete="tel"
              maxLength={20}
              required
              className="mt-3 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition placeholder:text-stone-300 focus:border-stone-900"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-6 py-4 text-sm font-semibold tracking-[0.12em] text-white transition hover:bg-white hover:text-stone-900 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                กำลังตรวจสอบ...
              </>
            ) : (
              <>
                <SearchCheck size={18} />
                ตรวจสอบสถานะ
              </>
            )}
          </button>
        </form>

        <Link
          href="/"
          className="mx-auto mt-6 flex min-h-12 w-fit items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-stone-600 transition hover:text-stone-900"
        >
          <ArrowLeft size={17} />
          กลับหน้าแรก
        </Link>
      </div>
    </main>
  );
}
