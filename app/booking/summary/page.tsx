"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, GraduationCap, Wallet } from "lucide-react";

import { useBooking } from "@/context/BookingContext";
import { PACKAGES } from "@/lib/packages";

export default function BookingSummaryPage() {
  const router = useRouter();

  const { booking, setBooking } = useBooking();

  const packageInfo = PACKAGES[booking.hours];

  const extraPrice =
  Math.max(0, booking.graduates - 1) *
  packageInfo.extraGraduatePrice;

  const totalPrice = useMemo(() => {
    return packageInfo.basePrice + extraPrice;
  }, [packageInfo, extraPrice]);

  const handleConfirm = () => {
    setBooking((prev) => ({
      ...prev,
      totalPrice,
    }));

    router.push("/booking/payment");
  };

  return (
    <main className="min-h-screen bg-[#F7F4EF] py-10">
      <div className="mx-auto max-w-5xl px-5">
        <div className="rounded-3xl bg-white p-8 shadow-xl md:p-10">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-[#4B3525]">
              สรุปรายการจอง
            </h1>

            <p className="mt-2 text-stone-500">
              ขั้นตอนที่ 3 จาก 5
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-8">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays size={20} />
                <span>วันที่</span>
              </div>

              <span className="font-semibold">
                {booking.date?.toLocaleDateString("th-TH")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock3 size={20} />
                <span>รอบเวลา</span>
              </div>

              <span className="font-semibold">
                {booking.period === "morning"
                  ? "รอบเช้า"
                  : "รอบบ่าย"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>จำนวนชั่วโมง</span>

              <span className="font-semibold">
                {booking.hours} ชั่วโมง
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap size={20} />
                <span>จำนวนบัณฑิต</span>
              </div>

              <span className="font-semibold">
                {booking.graduates} คน
              </span>
            </div>

            <hr />

            <div className="flex justify-between">
              <span>แพ็กเกจ</span>

              <span>
                {packageInfo.basePrice.toLocaleString()} บาท
              </span>
            </div>

            <div className="flex justify-between">
              <span>เพิ่มบัณฑิต</span>

              <span>
                {extraPrice.toLocaleString()} บาท
              </span>
            </div>

            <hr />

            <div className="flex items-center justify-between text-3xl font-bold text-amber-700">
              <div className="flex items-center gap-3">
                <Wallet />
                <span>รวมทั้งหมด</span>
              </div>

              <span>
                {totalPrice.toLocaleString()} บาท
              </span>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-stone-200 p-8">
            <h2 className="mb-5 text-2xl font-bold text-[#4B3525]">
              ข้อมูลผู้จอง
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Info title="ชื่อ" value={booking.fullname} />
              <Info title="เบอร์โทร" value={booking.phone} />
              <Info title="Line" value={booking.line} />
              <Info title="Facebook" value={booking.facebook} />
              <Info title="มหาวิทยาลัย" value={booking.university} />
              <Info title="คณะ" value={booking.faculty} />
            </div>

            {booking.note && (
              <div className="mt-6">
                <div className="mb-2 font-semibold">
                  รายละเอียดเพิ่มเติม
                </div>

                <div className="rounded-xl bg-stone-50 p-4 whitespace-pre-wrap">
                  {booking.note}
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 rounded-xl border py-4 text-lg font-bold transition hover:bg-stone-100"
            >
              ← ย้อนกลับ
            </button>

            <button
              onClick={handleConfirm}
              className="flex-1 rounded-xl bg-amber-700 py-4 text-lg font-bold text-white transition hover:bg-amber-800"
            >
              ยืนยันการจอง →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-sm text-stone-500">
        {title}
      </div>

      <div className="mt-1 rounded-xl border bg-stone-50 p-3 font-medium">
        {value || "-"}
      </div>
    </div>
  );
}