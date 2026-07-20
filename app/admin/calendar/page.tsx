import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { blockCalendarDay, blockCalendarSlot } from "@/app/admin/actions";
import {
  buildAdminPeriodMap,
  getAdminDayStatus,
} from "@/lib/admin-calendar";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BlockedSlot, Booking, BookingPeriod } from "@/types/booking";

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getPeriodLabel(period: BookingPeriod) {
  return period === "morning" ? "เช้า" : "บ่าย";
}

const DAY_STATUS_CLASSES = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-700",
  partial: "border-amber-200 bg-amber-50 text-amber-700",
  full: "border-stone-800 bg-stone-800 text-white",
};

function BlockSlotButton({
  dateKey,
  period,
  disabledLabel,
}: {
  dateKey: string;
  period: BookingPeriod;
  disabledLabel?: string;
}) {
  const disabled = Boolean(disabledLabel);

  return (
    <form action={blockCalendarSlot}>
      <input type="hidden" name="bookingDate" value={dateKey} />
      <input type="hidden" name="period" value={period} />
      <button
        type="submit"
        disabled={disabled}
        className={`admin-focus min-h-9 w-full rounded-lg border px-2 text-[11px] font-semibold transition ${
          disabled
            ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
            : "border-[var(--admin-border)] bg-white text-stone-700 hover:border-[var(--admin-accent)]"
        }`}
      >
        {disabledLabel ?? `ปิดรอบ${getPeriodLabel(period)}`}
      </button>
    </form>
  );
}

function BlockFullDayButton({
  dateKey,
  disabled,
}: {
  dateKey: string;
  disabled: boolean;
}) {
  return (
    <form action={blockCalendarDay}>
      <input type="hidden" name="bookingDate" value={dateKey} />
      <button
        type="submit"
        disabled={disabled}
        className={`admin-focus min-h-9 w-full rounded-lg border px-2 text-[11px] font-semibold transition ${
          disabled
            ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
            : "border-red-200 bg-red-50 text-red-700 hover:border-red-400"
        }`}
      >
        {disabled ? "ปิดครบทั้งวันแล้ว" : "ปิดคิวทั้งวัน"}
      </button>
    </form>
  );
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}) {
  const params = await searchParams;

  const now = new Date();

  const requestedYear = Number(params.year ?? now.getFullYear());
  const requestedMonth = Number(params.month ?? now.getMonth() + 1);
  const year = Number.isInteger(requestedYear) && requestedYear >= 2020 && requestedYear <= 2100
    ? requestedYear
    : now.getFullYear();
  const month = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12
    ? requestedMonth - 1
    : now.getMonth();

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = getDaysInMonth(year, month);

  const monthStart = formatDateLocal(new Date(year, month, 1));
  const monthEnd = formatDateLocal(new Date(year, month + 1, 0));

  const prevMonthDate = new Date(year, month - 1, 1);
  const nextMonthDate = new Date(year, month + 1, 1);

  const prevUrl = `/admin/calendar?year=${prevMonthDate.getFullYear()}&month=${
    prevMonthDate.getMonth() + 1
  }`;

  const nextUrl = `/admin/calendar?year=${nextMonthDate.getFullYear()}&month=${
    nextMonthDate.getMonth() + 1
  }`;

  const supabase = createAdminClient();

  const [bookingsResult, blockedSlotsResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .gte("booking_date", monthStart)
      .lte("booking_date", monthEnd)
      .in("status", ["pending", "paid", "confirmed", "completed"])
      .order("booking_date", { ascending: true }),
    supabase
      .from("blocked_slots")
      .select("*")
      .gte("booking_date", monthStart)
      .lte("booking_date", monthEnd)
      .order("booking_date", { ascending: true }),
  ]);

  if (bookingsResult.error) {
    throw bookingsResult.error;
  }

  if (blockedSlotsResult.error) {
    throw blockedSlotsResult.error;
  }

  const bookings = (bookingsResult.data ?? []) as Booking[];
  const blockedSlots = (blockedSlotsResult.data ?? []) as BlockedSlot[];
  const bookingPeriodMap = buildAdminPeriodMap(bookings);
  const blockedPeriodMap = buildAdminPeriodMap(blockedSlots);

  return (
    <main className="min-h-screen px-3 py-4 sm:px-5 sm:py-5 lg:px-7 xl:px-8">
      <div className="mx-auto max-w-[1540px] space-y-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--admin-accent)]">
              Nimman Foto · ผู้ดูแลระบบ
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
              ปฏิทินคิว
            </h1>
            <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
              ดูคิวจองรายเดือน และปิดรอบเช้าหรือรอบบ่ายจากปฏิทิน
            </p>
          </div>

          <Link
            href="/admin"
            className="admin-focus inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-white px-4 text-sm font-semibold hover:border-[var(--admin-accent)]"
          >
            กลับแดชบอร์ด
          </Link>
        </header>

        <section aria-label="เลือกเดือน" className="admin-panel p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={prevUrl}
              aria-label="เดือนก่อนหน้า"
              className="admin-focus inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[var(--admin-border)] bg-white px-3 text-sm font-semibold hover:border-[var(--admin-accent)]"
            >
              <ChevronLeft aria-hidden="true" size={17} /> เดือนก่อนหน้า
            </Link>

            <div className="text-center">
              <h2 className="text-lg font-bold sm:text-xl">
                {firstDay.toLocaleDateString("th-TH", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>

              <Link
                href="/admin/calendar"
                className="admin-focus mt-1 inline-flex rounded-lg px-2 py-1 text-xs font-semibold text-[var(--admin-accent)] hover:bg-[var(--admin-surface-muted)]"
              >
                เดือนปัจจุบัน
              </Link>
            </div>

            <Link
              href={nextUrl}
              aria-label="เดือนถัดไป"
              className="admin-focus inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[var(--admin-border)] bg-white px-3 text-sm font-semibold hover:border-[var(--admin-accent)]"
            >
              เดือนถัดไป <ChevronRight aria-hidden="true" size={17} />
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
              ว่าง
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">
              มีจองหรือปิดแล้ว 1 รอบ
            </span>
            <span className="rounded-full border border-stone-900 bg-stone-900 px-3 py-1.5 text-white">
              เต็ม
            </span>
          </div>
        </section>

        <section aria-label="ปฏิทินรายการจอง" className="admin-panel overflow-hidden">
          <div className="hidden grid-cols-7 bg-[var(--admin-surface-muted)] text-center text-xs font-semibold text-[var(--admin-muted)] md:grid">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
              <div key={d} className="border-r border-[var(--admin-border)] p-2.5 last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-7 md:gap-0 md:p-0">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="hidden min-h-44 border-r border-t border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/55 md:block"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const dateKey = formatDateLocal(date);

              const dayBookings = bookings.filter(
                (b) => b.booking_date === dateKey
              );

              const dayBlockedSlots = blockedSlots.filter(
                (slot) => slot.booking_date === dateKey
              );

              const bookedPeriods = bookingPeriodMap[dateKey] ?? {
                morning: false,
                afternoon: false,
              };

              const blockedPeriods = blockedPeriodMap[dateKey] ?? {
                morning: false,
                afternoon: false,
              };

              const hasMorning = bookedPeriods.morning || blockedPeriods.morning;
              const hasAfternoon =
                bookedPeriods.afternoon || blockedPeriods.afternoon;
              const status = getAdminDayStatus(hasMorning, hasAfternoon);
              const morningDisabledLabel = blockedPeriods.morning
                ? "เช้าปิดแล้ว"
                : bookedPeriods.morning
                ? "เช้ามีจองแล้ว"
                : undefined;
              const afternoonDisabledLabel = blockedPeriods.afternoon
                ? "บ่ายปิดแล้ว"
                : bookedPeriods.afternoon
                ? "บ่ายมีจองแล้ว"
                : undefined;

              return (
                <article
                  key={dateKey}
                  className="min-h-44 rounded-xl border border-[var(--admin-border)] p-3 md:rounded-none md:border-0 md:border-r md:border-t"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-bold">
                      {day}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${DAY_STATUS_CLASSES[status.tone]}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1.5">
                    <BlockFullDayButton
                      dateKey={dateKey}
                      disabled={hasMorning && hasAfternoon}
                    />
                    <BlockSlotButton
                      dateKey={dateKey}
                      period="morning"
                      disabledLabel={morningDisabledLabel}
                    />
                    <BlockSlotButton
                      dateKey={dateKey}
                      period="afternoon"
                      disabledLabel={afternoonDisabledLabel}
                    />
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {dayBlockedSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="rounded-lg border border-[var(--admin-border)] bg-stone-100 px-2.5 py-2 text-xs text-stone-600"
                      >
                        <div className="font-semibold text-stone-800">
                          ปิดรอบ{getPeriodLabel(slot.period)}
                        </div>
                        <div className="mt-1 text-[11px] text-stone-500">
                          blocked_slots
                        </div>
                      </div>
                    ))}

                    {dayBookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/admin/bookings/${booking.id}`}
                        className="admin-focus block rounded-lg border border-[var(--admin-border)] bg-white px-2.5 py-2 text-xs transition hover:border-[var(--admin-accent)]"
                      >
                        <div className="font-semibold text-stone-900">
                          จองรอบ{getPeriodLabel(booking.period)}
                        </div>
                        <div className="mt-1 text-stone-600">
                          {booking.start_time && booking.end_time
                            ? `${booking.start_time} - ${booking.end_time}`
                            : "-"}
                        </div>
                        <div className="mt-1 truncate text-stone-400">
                          {booking.fullname}
                        </div>
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
