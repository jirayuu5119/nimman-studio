import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { blockCalendarSlot } from "@/app/admin/actions";
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

function getDayStatus(hasMorning: boolean, hasAfternoon: boolean) {
  if (hasMorning && hasAfternoon) {
    return {
      label: "เต็ม",
      className: "border-stone-900 bg-stone-900 text-white",
    };
  }

  if (hasMorning || hasAfternoon) {
    return {
      label: hasMorning ? "เช้าไม่ว่าง" : "บ่ายไม่ว่าง",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "ว่าง",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function buildPeriodMap<T extends { booking_date: string; period: BookingPeriod }>(
  items: T[]
) {
  return items.reduce<Record<string, { morning: boolean; afternoon: boolean }>>(
    (acc, item) => {
      if (!acc[item.booking_date]) {
        acc[item.booking_date] = {
          morning: false,
          afternoon: false,
        };
      }

      acc[item.booking_date][item.period] = true;
      return acc;
    },
    {}
  );
}

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
        className={`w-full rounded-full border px-3 py-2 text-[11px] font-semibold transition ${
          disabled
            ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
            : "border-stone-300 bg-white text-stone-700 hover:border-stone-900 hover:bg-stone-900 hover:text-white"
        }`}
      >
        {disabledLabel ?? `ปิดรอบ${getPeriodLabel(period)}`}
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

  const year = Number(params.year ?? now.getFullYear());
  const month = Number(params.month ?? now.getMonth() + 1) - 1;

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
  const bookingPeriodMap = buildPeriodMap(bookings);
  const blockedPeriodMap = buildPeriodMap(blockedSlots);

  return (
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-stone-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
              Nimman Foto Admin
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
              Admin Calendar
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              ดูคิวจองรายเดือน และปิดรอบเช้าหรือรอบบ่ายจากปฏิทิน
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
          >
            กลับ Dashboard
          </Link>
        </div>

        <div className="mb-8 rounded-[1.5rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={prevUrl}
              className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
            >
              เดือนก่อนหน้า
            </Link>

            <div className="text-center">
              <h2 className="font-serif text-2xl font-semibold text-stone-900">
                {firstDay.toLocaleDateString("th-TH", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>

              <Link
                href="/admin/calendar"
                className="mt-3 inline-flex rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-stone-900"
              >
                เดือนปัจจุบัน
              </Link>
            </div>

            <Link
              href={nextUrl}
              className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
            >
              เดือนถัดไป
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
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-stone-200/80 bg-white/90 shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-7 bg-stone-50/80 text-center text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
              <div key={d} className="border-r border-stone-200 p-3 last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="hidden min-h-[180px] border-r border-t border-stone-200 bg-stone-50/40 p-3 md:block"
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
              const status = getDayStatus(hasMorning, hasAfternoon);
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
                <div
                  key={dateKey}
                  className="min-h-[180px] border-t border-stone-200 p-3 md:border-r md:last:border-r-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif text-xl font-semibold text-stone-900">
                      {day}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2">
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

                  <div className="mt-3 space-y-2">
                    {dayBlockedSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="rounded-xl border border-stone-200 bg-stone-100 px-3 py-2 text-xs text-stone-600"
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
                        className="block rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs transition hover:border-stone-400 hover:bg-stone-50"
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
