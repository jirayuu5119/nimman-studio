import { updateBookingStatus } from "@/app/admin/actions";
import StatusBadge from "@/app/admin/StatusBadge";
import type { Booking } from "@/types/booking";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
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

function getLegacySlipPath(slipUrl: string | null) {
  if (!slipUrl) return null;

  try {
    const url = new URL(slipUrl);
    const marker = "/storage/v1/object/public/slips/";
    if (!url.pathname.startsWith(marker)) return null;
    const path = decodeURIComponent(url.pathname.slice(marker.length));
    return path && !path.includes("..") ? path : null;
  } catch {
    return null;
  }
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
    <div className="flex items-start justify-between gap-4 border-b border-[var(--admin-border)] py-3 last:border-b-0">
      <span className="text-sm text-[var(--admin-muted)]">{label}</span>
      <span className="max-w-[65%] break-words text-right text-sm font-medium text-[var(--admin-text)]">
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
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
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
      <span className="text-xl font-bold">
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
  await requireAdmin();

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  const booking = data as BookingDetailRecord;
  const slipPath =
    booking.slip_path?.trim() || getLegacySlipPath(booking.slip_url);
  const { data: signedSlip } = slipPath
    ? await supabase.storage.from("slips").createSignedUrl(slipPath, 10 * 60)
    : { data: null };
  const slipDisplayUrl = signedSlip?.signedUrl ?? null;
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
    redirect("/admin");
  }

  async function complete() {
    "use server";
    await updateBookingStatus(id, "completed");
    redirect("/admin");
  }

  async function reject() {
    "use server";
    await updateBookingStatus(id, "cancelled");
    redirect("/admin");
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-5 sm:py-5 lg:px-7 xl:px-8">
      <div className="mx-auto max-w-[1280px] space-y-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--admin-accent)]">
              รายละเอียดการจอง
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="break-all text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                {booking.booking_no}
              </h1>
              <StatusBadge status={booking.status} />
            </div>
            <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
              ตรวจสอบข้อมูลลูกค้า ยอดชำระ และสลิปโอนเงิน
            </p>
          </div>

          <Link
            href="/admin"
            className="admin-focus inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-white px-4 text-sm font-semibold hover:border-[var(--admin-accent)]"
          >
            กลับ Dashboard
          </Link>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="space-y-4">
            <div className="admin-panel p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-[var(--admin-accent)]">
                  Summary
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  ข้อมูลการจอง
                </h2>
              </div>

              <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-4 py-1">
                <DetailRow label="วันที่" value={booking.booking_date} />
                <DetailRow label="รอบเวลา" value={getPeriodLabel(booking.period)} />
                <DetailRow label="ช่วงเวลาถ่าย" value={shootingTime} />
                <DetailRow label="จำนวนชั่วโมง" value={`${booking.hours} ชั่วโมง`} />
                <DetailRow label="จำนวนบัณฑิต" value={`${booking.graduates} คน`} />
                <DetailRow label="สถานะ" value={<StatusBadge status={booking.status} />} />
              </div>
            </div>

            <div className="admin-panel p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-[var(--admin-accent)]">
                  Payment
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  สรุปยอดเงิน
                </h2>
              </div>

              <div className="grid gap-3">
                <MoneyRow label="ราคาเต็ม" value={totalPrice} highlight />
                <MoneyRow label="มัดจำ" value={depositAmount} />
                <MoneyRow label="ยอดคงเหลือ" value={remainingAmount} />
              </div>
            </div>

            <div className="admin-panel p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-[var(--admin-accent)]">
                  Actions
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  อัปเดตสถานะ
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <form action={approve}>
                  <button
                    type="submit"
                    className="admin-focus min-h-11 w-full rounded-xl border border-emerald-700 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-white hover:text-emerald-700"
                  >
                    ยืนยัน
                  </button>
                </form>

                <form action={complete}>
                  <button
                    type="submit"
                    className="admin-focus min-h-11 w-full rounded-xl border border-sky-700 bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-white hover:text-sky-700"
                  >
                    เสร็จสิ้น
                  </button>
                </form>

                <form action={reject}>
                  <button
                    type="submit"
                    className="admin-focus min-h-11 w-full rounded-xl border border-red-300 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:border-red-500"
                  >
                    ยกเลิก
                  </button>
                </form>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="admin-panel p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-[var(--admin-accent)]">
                  Customer
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  ข้อมูลลูกค้า
                </h2>
              </div>

              <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-4 py-1">
                <DetailRow label="ชื่อ" value={booking.fullname} />
                <DetailRow label="โทร" value={booking.phone} />
                <DetailRow label="Line" value={booking.line} />
                <DetailRow label="Facebook" value={booking.facebook} />
                <DetailRow label="มหาวิทยาลัย" value={booking.university} />
                <DetailRow label="คณะ" value={booking.faculty} />
                <DetailRow label="หมายเหตุ" value={booking.note} />
              </div>
            </div>

            <div className="admin-panel p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-[var(--admin-accent)]">
                  Slip
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  สลิปโอนเงิน
                </h2>
              </div>

              {slipDisplayUrl ? (
                <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slipDisplayUrl}
                    alt="Slip"
                    className="max-h-[680px] w-full object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-8 text-center text-sm text-[var(--admin-muted)]">
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
