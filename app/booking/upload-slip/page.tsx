"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Upload,
  Trash2,
  CheckCircle2,
  Loader2,
  ImagePlus,
  Copy,
  Check,
  CreditCard,
} from "lucide-react";

import { useBooking } from "@/context/BookingContext";

const DEPOSIT_AMOUNT = 1000;

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function UploadSlipPage() {
  const router = useRouter();
  const { booking, setBooking } = useBooking();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const realPromptPayNumber = "8302376723";

  const depositAmount = booking.depositAmount ?? DEPOSIT_AMOUNT;
  const totalPrice = booking.totalPrice ?? 0;
  const remainingAmount =
    booking.remainingAmount ?? Math.max(totalPrice - depositAmount, 0);

  const preview = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const copyPromptPay = async () => {
    await navigator.clipboard.writeText(realPromptPayNumber);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      alert("กรุณาเลือกรูปภาพ");
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("กรุณาอัปโหลดสลิป");
      return;
    }

    if (
      !booking.date ||
      !booking.period ||
      !booking.startTime ||
      !booking.endTime
    ) {
      alert("ข้อมูลการจองไม่ครบ กรุณากลับไปเลือกวันและเวลาใหม่");
      router.push("/booking");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("slip", file);
      formData.append("bookingDate", formatDateLocal(booking.date));
      formData.append("period", booking.period);
      formData.append("startTime", booking.startTime);
      formData.append("endTime", booking.endTime);
      formData.append("hours", String(booking.hours));
      formData.append("graduates", String(booking.graduates));
      formData.append("fullname", booking.fullname);
      formData.append("phone", booking.phone);
      formData.append("line", booking.line);
      formData.append("facebook", booking.facebook);
      formData.append("university", booking.university);
      formData.append("faculty", booking.faculty);
      formData.append("note", booking.note);
      formData.append("totalPrice", String(totalPrice));

      const response = await fetch("/api/bookings/create", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "บันทึกการจองไม่สำเร็จ กรุณาลองใหม่"
        );
      }

      setBooking((prev) => ({
        ...prev,
        depositAmount,
        remainingAmount: result.remainingAmount ?? remainingAmount,
        slipUrl: result.slipUrl ?? "",
        status: "pending",
      }));

      const successParams = new URLSearchParams({
        bookingNo: result.bookingNo,
        token: result.accessToken,
      });

      router.push(`/booking/success?${successParams.toString()}`);
    } catch (error) {
      console.error("BOOKING ERROR:", error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-stone-900 md:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
            Step 04
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
            อัปโหลดสลิป
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-500 md:text-base">
            อัปโหลดรูปสลิปโอนเงิน เพื่อยืนยันการจอง
            <br className="hidden md:block" />
            หลังยืนยันแล้ว ระบบจะบันทึกข้อมูลและแจ้งเตือนอัตโนมัติ
          </p>
        </div>

        <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <section>
              <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50/80 px-6 py-10 text-center transition hover:border-stone-900 hover:bg-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700">
                  <Upload size={28} />
                </div>

                <div className="mt-5 text-lg font-semibold text-stone-900">
                  คลิกเพื่อเลือกรูปสลิป
                </div>

                <div className="mt-2 text-sm leading-6 text-stone-500">
                  รองรับไฟล์ JPG / PNG / HEIC
                  <br />
                  แนะนำให้ใช้รูปที่เห็นยอดและเวลาชัดเจน
                </div>

                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                />
              </label>

              {preview && (
                <div className="mt-6">
                  <div className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-50">
                    <Image
                      src={preview}
                      alt="Slip Preview"
                      width={1000}
                      height={1000}
                      className="max-h-[520px] w-full object-contain"
                      unoptimized
                    />
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setFile(null)}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                    ลบรูป
                  </button>
                </div>
              )}
            </section>

            <section className="space-y-5">
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5 md:p-6">
                <div className="mb-5 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-stone-700">
                    <CreditCard size={22} />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                      PromptPay QR
                    </p>

                    <h2 className="mt-2 text-lg font-semibold text-stone-900">
                      ชำระมัดจำก่อนอัปโหลดสลิป
                    </h2>
                  </div>
                </div>

                <div className="mx-auto max-w-[260px] rounded-[1.25rem] border border-stone-200 bg-white p-3">
                  <Image
                    src="/promptpay-qr.png"
                    alt="PromptPay QR"
                    width={320}
                    height={320}
                    priority
                    className="h-auto w-full rounded-xl"
                  />
                </div>

                <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
                      PromptPay
                    </p>
                    <p className="mt-1 font-serif text-2xl font-semibold tracking-wide text-stone-900">
                      {realPromptPayNumber}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyPromptPay}
                    className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${
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
                    <CheckCircle2 size={22} />
                  </div>

                  <div className="w-full">
                    <p className="text-sm text-stone-300">ยอดมัดจำ</p>

                    <div className="mt-2 font-serif text-4xl font-semibold">
                      {depositAmount.toLocaleString()} บาท
                    </div>

                    <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-stone-300">ราคาเต็ม</span>
                        <span className="font-medium text-white">
                          {totalPrice.toLocaleString()} บาท
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-300">มัดจำ</span>
                        <span className="font-medium text-white">
                          {depositAmount.toLocaleString()} บาท
                        </span>
                      </div>

                      <div className="h-px bg-white/10" />

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-300">
                          ยอดคงเหลือวันงาน
                        </span>
                        <span className="font-semibold text-white">
                          {remainingAmount.toLocaleString()} บาท
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-stone-300">
                      กรุณาตรวจสอบยอดในสลิปให้ตรงกับยอดมัดจำก่อนกดยืนยัน
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                    <ImagePlus size={22} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">
                      สถานะสลิป
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-stone-500">
                      {file
                        ? `เลือกไฟล์แล้ว: ${file.name}`
                        : "ยังไม่ได้เลือกรูปสลิป"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5">
                <h3 className="text-sm font-semibold text-stone-900">
                  หมายเหตุ
                </h3>

                <p className="mt-2 text-sm leading-6 text-stone-500">
                  หลังจากกดยืนยันการจอง ระบบจะบันทึกข้อมูลลงฐานข้อมูล และส่งแจ้งเตือนไปยัง ADMIN อัตโนมัติ หากมีค่าใช้จ่ายค่าเดินทางเพิ่มเติม ADMIN จะรีบติดต่อกลับส่วนตัว
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <button
              disabled={loading}
              onClick={() => router.back()}
              className="rounded-full border border-stone-300 bg-white px-6 py-4 text-sm font-semibold tracking-[0.12em] text-stone-700 transition hover:border-stone-900 disabled:opacity-50"
            >
              ← ย้อนกลับ
            </button>

            <button
              disabled={loading || !file}
              onClick={handleSubmit}
              className={`flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold tracking-[0.12em] transition ${
                loading || !file
                  ? "cursor-not-allowed bg-stone-200 text-stone-400"
                  : "border border-stone-900 bg-stone-900 text-white hover:bg-white hover:text-stone-900"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "ยืนยันการจอง →"
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
