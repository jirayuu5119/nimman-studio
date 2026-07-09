"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  GraduationCap,
  Wallet,
  User,
  Phone,
  MessageCircle,
  AtSign,
  School,
  FileText,
} from "lucide-react";

import { useBooking } from "@/context/BookingContext";
import { PACKAGES } from "@/lib/packages";

const DEPOSIT_AMOUNT = 1000;

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

  const remainingAmount = Math.max(
    totalPrice - DEPOSIT_AMOUNT,
    0
  );

  const handleConfirm = () => {
    setBooking((prev) => ({
      ...prev,
      totalPrice,
      depositAmount: DEPOSIT_AMOUNT,
      remainingAmount,
    }));

    router.push("/booking/upload-slip");
  };

  return (
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-stone-900 md:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
            Step 03
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
            สรุปรายการจอง
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-500 md:text-base">
            ตรวจสอบรายละเอียดก่อนเข้าสู่ขั้นตอนชำระมัดจำ
          </p>
        </div>

        <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5 md:p-6">
              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                  Booking Detail
                </p>

                <h2 className="mt-2 text-xl font-semibold text-stone-900">
                  รายละเอียดการถ่าย
                </h2>
              </div>

              <div className="space-y-3">
                <SummaryRow
                  icon={<CalendarDays size={18} />}
                  label="วันที่"
                  value={
                    booking.date?.toLocaleDateString("th-TH") || "-"
                  }
                />

                <SummaryRow
                  icon={<Clock3 size={18} />}
                  label="รอบเวลา"
                  value={
                    booking.period === "morning"
                      ? "รอบเช้า"
                      : booking.period === "afternoon"
                      ? "รอบบ่าย"
                      : "-"
                  }
                />

                <SummaryRow
                  icon={<Clock3 size={18} />}
                  label="ช่วงเวลาถ่าย"
                  value={
                    booking.startTime && booking.endTime
                      ? `${booking.startTime} - ${booking.endTime}`
                      : "-"
                  }
                />

                <SummaryRow
                  icon={<Clock3 size={18} />}
                  label="จำนวนชั่วโมง"
                  value={`${booking.hours} ชั่วโมง`}
                />

                <SummaryRow
                  icon={<GraduationCap size={18} />}
                  label="จำนวนบัณฑิต"
                  value={`${booking.graduates} คน`}
                />
              </div>

              <div className="mt-6 rounded-[1.25rem] border border-stone-200 bg-white p-5">
                <div className="space-y-4 text-sm">
                  <PriceRow
                    label="แพ็กเกจ"
                    value={`${packageInfo.basePrice.toLocaleString()} บาท`}
                  />

                  <PriceRow
                    label="เพิ่มบัณฑิต"
                    value={`${extraPrice.toLocaleString()} บาท`}
                  />

                  <div className="h-px bg-stone-200" />

                  <PriceRow
                    label="ราคาเต็ม"
                    value={`${totalPrice.toLocaleString()} บาท`}
                  />

                  <PriceRow
                    label="ชำระมัดจำวันนี้"
                    value={`${DEPOSIT_AMOUNT.toLocaleString()} บาท`}
                    highlight
                  />

                  <PriceRow
                    label="ยอดคงเหลือวันงาน"
                    value={`${remainingAmount.toLocaleString()} บาท`}
                  />

                  <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex items-center gap-2 text-stone-500">
                        <Wallet size={18} />
                        <span>ยอดที่ต้องโอนตอนนี้</span>
                      </div>

                      <span className="font-serif text-3xl font-semibold text-stone-900">
                        {DEPOSIT_AMOUNT.toLocaleString()} บาท
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-6 text-stone-500">
                      ส่วนที่เหลือชำระภายในวันถ่ายงาน หรือตามเงื่อนไขที่ตกลงกับช่างภาพ
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 md:p-6">
              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                  Customer
                </p>

                <h2 className="mt-2 text-xl font-semibold text-stone-900">
                  ข้อมูลผู้จอง
                </h2>
              </div>

              <div className="space-y-3">
                <Info
                  icon={<User size={17} />}
                  title="ชื่อ"
                  value={booking.fullname}
                />

                <Info
                  icon={<Phone size={17} />}
                  title="เบอร์โทร"
                  value={booking.phone}
                />

                <Info
                  icon={<MessageCircle size={17} />}
                  title="Line"
                  value={booking.line}
                />

                <Info
                  icon={<AtSign size={17} />}
                  title="Facebook"
                  value={booking.facebook}
                />

                <Info
                  icon={<School size={17} />}
                  title="มหาวิทยาลัย"
                  value={booking.university}
                />

                <Info
                  icon={<GraduationCap size={17} />}
                  title="คณะ"
                  value={booking.faculty}
                />
              </div>

              {booking.note && (
                <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
                    <FileText size={16} />
                    รายละเอียดเพิ่มเติม
                  </div>

                  <div className="whitespace-pre-wrap text-sm leading-6 text-stone-500">
                    {booking.note}
                  </div>
                </div>
              )}
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
              onClick={handleConfirm}
              className="rounded-full border border-stone-900 bg-stone-900 px-6 py-4 text-sm font-semibold tracking-[0.12em] text-white transition hover:bg-white hover:text-stone-900"
            >
              ชำระมัดจำและอัปโหลดสลิป →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-4">
      <div className="flex items-center gap-3 text-sm text-stone-500">
        <span className="text-stone-400">{icon}</span>
        <span>{label}</span>
      </div>

      <span className="text-right text-sm font-semibold text-stone-900">
        {value}
      </span>
    </div>
  );
}

function PriceRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          highlight
            ? "font-semibold text-stone-900"
            : "text-stone-500"
        }
      >
        {label}
      </span>

      <span
        className={
          highlight
            ? "font-semibold text-stone-900"
            : "font-medium text-stone-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Info({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-stone-400">
        {icon}
        {title}
      </div>

      <div className="mt-2 text-sm font-medium leading-6 text-stone-900">
        {value || "-"}
      </div>
    </div>
  );
}
