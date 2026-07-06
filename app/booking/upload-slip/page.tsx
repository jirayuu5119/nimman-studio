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
} from "lucide-react";

import { useBooking } from "@/context/BookingContext";
import { uploadSlip } from "@/lib/storage";
import { generateBookingNo } from "@/lib/booking";
import { createBooking } from "@/lib/database";

export default function UploadSlipPage() {
  const router = useRouter();
  const { booking, setBooking } = useBooking();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

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

      const slipUrl = await uploadSlip(file);
      const bookingNo = generateBookingNo();

      const result = await createBooking(bookingNo, {
        ...booking,
        slipUrl,
        status: "pending",
      });

      if (!result || result.length === 0) {
        throw new Error("บันทึกการจองไม่สำเร็จ กรุณาลองใหม่");
      }

      setBooking((prev) => ({
        ...prev,
        slipUrl,
        status: "pending",
      }));

      router.push(`/booking/success?bookingNo=${bookingNo}`);
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
            Step 05
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
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-900 p-5 text-white md:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <CheckCircle2 size={22} />
                  </div>

                  <div>
                    <p className="text-sm text-stone-300">ยอดชำระ</p>

                    <div className="mt-2 font-serif text-4xl font-semibold">
                      {booking.totalPrice.toLocaleString()} บาท
                    </div>

                    <p className="mt-3 text-sm leading-6 text-stone-300">
                      กรุณาตรวจสอบยอดในสลิปให้ตรงกับยอดชำระก่อนกดยืนยัน
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
                  หลังจากกดยืนยันการจอง ระบบจะบันทึกข้อมูลลงฐานข้อมูล
                  และส่งแจ้งเตือนไปยัง Discord อัตโนมัติ
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