"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, Trash2, CheckCircle2, Loader2 } from "lucide-react";

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

    if (!booking.date || !booking.period || !booking.startTime || !booking.endTime) {
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
    <main className="min-h-screen bg-[#F7F4EF] py-10">
      <div className="mx-auto max-w-3xl px-5">
        <div className="rounded-3xl bg-white p-10 shadow-xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#4B3525]">
              อัปโหลดสลิป
            </h1>

            <p className="mt-2 text-stone-500">ขั้นตอนที่ 5 จาก 5</p>
          </div>

          <label className="mt-10 flex h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-300 bg-stone-50 transition hover:bg-stone-100">
            <Upload size={46} className="text-amber-700" />

            <div className="mt-4 text-xl font-bold">
              คลิกเพื่อเลือกรูปสลิป
            </div>

            <div className="mt-2 text-stone-500">JPG / PNG / HEIC</div>

            <input hidden type="file" accept="image/*" onChange={handleFile} />
          </label>

          {preview && (
            <div className="mt-8">
              <div className="overflow-hidden rounded-2xl border">
                <Image
                  src={preview}
                  alt="Slip Preview"
                  width={1000}
                  height={1000}
                  className="w-full"
                  unoptimized
                />
              </div>

              <button
                disabled={loading}
                onClick={() => setFile(null)}
                className="mt-4 flex items-center gap-2 rounded-xl border px-5 py-3 transition hover:bg-stone-100 disabled:opacity-50"
              >
                <Trash2 size={18} />
                ลบรูป
              </button>
            </div>
          )}

          <div className="mt-8 rounded-2xl bg-stone-50 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-600" />

              <div>
                <div className="font-semibold">ยอดชำระ</div>

                <div className="text-2xl font-bold text-amber-700">
                  {booking.totalPrice.toLocaleString()} บาท
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button
              disabled={loading}
              onClick={() => router.back()}
              className="flex-1 rounded-xl border py-4 text-lg font-bold transition hover:bg-stone-100 disabled:opacity-50"
            >
              ← ย้อนกลับ
            </button>

            <button
              disabled={loading}
              onClick={handleSubmit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-700 py-4 text-lg font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-400"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
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