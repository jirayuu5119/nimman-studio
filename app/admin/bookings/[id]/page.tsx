import { updateBookingStatus } from "@/app/admin/actions";
import StatusBadge from "@/app/admin/StatusBadge";
import type { Booking } from "@/types/booking";
import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BookingDetailRecord = Omit<
  Booking,
  "total_price" | "deposit_amount" | "remaining_amount"
> & {
  total_price: number | null;
  deposit_amount: number | null;
  remaining_amount: number | null;
};

const moneyFormatter = new Intl.NumberFormat("th-TH");

function formatMoney(value: number) {
  return `${moneyFormatter.format(value)} บาท`;
}

function getPeriodLabel(period: string) {
  if (period === "morning") return "รอบเช้า";
  if (period === "afternoon") return "รอบบ่าย";
  return period || "-";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  const displayValue = value === "" || value == null ? "-" : value;

  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 py-3 last:border-b-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-right text-sm font-medium text-stone-900">
        {displayValue}
      </span>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${
        highlight
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-200 bg-white text-stone-900"
      }`}
    >
      <span
        className={`text-sm font-medium ${
          highlight ? "text-stone-200" : "text-stone-500"
        }`}
      >
        {label}
      </span>
      <span className="font-serif text-2xl font-semibold">
        {formatMoney(value)}
      </span>
    </div>
  );
}

export default async function BookingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  const booking = data as BookingDetailRecord;
  const totalPrice = booking.total_price ?? 0;
  const depositAmount = booking.deposit_amount ?? 1000;
  const remainingAmount =
    booking.remaining_amount ?? Math.max(totalPrice - depositAmount, 0);
  const shootingTime =
    booking.start_time && booking.end_time
      ? `${booking.start_time} - ${booking.end_time}`
      : getPeriodLabel(booking.period);

  async function approve() {
    "use server";
    await updateBookingStatus(id, "confirmed");
    redirect(`/admin/bookings/${id}`);
  }

  async function complete() {
    "use server";
    await updateBookingStatus(id, "completed");
    redirect(`/admin/bookings/${id}`);
  }

  async function reject() {
    "use server";
    await updateBookingStatus(id, "cancelled");
    redirect(`/admin/bookings/${id}`);
  }

  return (
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-stone-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
              Booking Detail
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
                {booking.booking_no}
              </h1>
              <StatusBadge status={booking.status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              ตรวจสอบข้อมูลลูกค้า ยอดชำระ และสลิปโอนเงิน
            </p>
          </div>

          <a
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
          >
            กลับ Dashboard
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] md:p-6">
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                  Summary
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">
                  ข้อมูลการจอง
                </h2>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-5 py-2">
                <DetailRow label="วันที่" value={booking.booking_date} />
                <DetailRow label="รอบเวลา" value={getPeriodLabel(booking.period)} />
                <DetailRow label="ช่วงเวลาถ่าย" value={shootingTime} />
                <DetailRow label="จำนวนชั่วโมง" value={`${booking.hours} ชั่วโมง`} />
                <DetailRow label="จำนวนบัณฑิต" value={`${booking.graduates} คน`} />
                <DetailRow label="สถานะ" value={<StatusBadge status={booking.status} />} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] md:p-6">
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                  Payment
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">
                  สรุปยอดเงิน
                </h2>
              </div>

              <div className="grid gap-3">
                <MoneyRow label="ราคาเต็ม" value={totalPrice} highlight />
                <MoneyRow label="มัดจำ" value={depositAmount} />
                <MoneyRow label="ยอดคงเหลือ" value={remainingAmount} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] md:p-6">
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                  Actions
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">
                  อัปเดตสถานะ
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <form action={approve}>
                  <button
                    type="submit"
                    className="w-full rounded-full border border-emerald-700 bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-emerald-700"
                  >
                    ยืนยัน
                  </button>
                </form>

                <form action={complete}>
                  <button
                    type="submit"
                    className="w-full rounded-full border border-blue-700 bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-blue-700"
                  >
                    เสร็จสิ้น
                  </button>
                </form>

                <form action={reject}>
                  <button
                    type="submit"
                    className="w-full rounded-full border border-red-600 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-600 hover:text-white"
                  >
                    ยกเลิก
                  </button>
                </form>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] md:p-6">
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                  Customer
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">
                  ข้อมูลลูกค้า
                </h2>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-5 py-2">
                <DetailRow label="ชื่อ" value={booking.fullname} />
                <DetailRow label="โทร" value={booking.phone} />
                <DetailRow label="Line" value={booking.line} />
                <DetailRow label="Facebook" value={booking.facebook} />
                <DetailRow label="มหาวิทยาลัย" value={booking.university} />
                <DetailRow label="คณะ" value={booking.faculty} />
                <DetailRow label="หมายเหตุ" value={booking.note} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] md:p-6">
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                  Slip
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">
                  สลิปโอนเงิน
                </h2>
              </div>

              {booking.slip_url ? (
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={booking.slip_url}
                    alt="Slip"
                    className="max-h-[680px] w-full object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 p-8 text-center text-sm text-stone-500">
                  ยังไม่มีสลิป
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
