import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Booking } from "@/types/booking";

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getPeriodStatus(bookings: Booking[]) {
  const hasMorning = bookings.some((b) => b.period === "morning");
  const hasAfternoon = bookings.some((b) => b.period === "afternoon");

  if (hasMorning && hasAfternoon) {
    return {
      label: "เต็ม",
      className: "bg-red-100 text-red-700 border-red-200",
    };
  }

  if (hasMorning) {
    return {
      label: "เช้า",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
  }

  if (hasAfternoon) {
    return {
      label: "บ่าย",
      className: "bg-orange-100 text-orange-700 border-orange-200",
    };
  }

  return {
    label: "ว่าง",
    className: "bg-green-100 text-green-700 border-green-200",
  };
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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .gte("booking_date", monthStart)
    .lte("booking_date", monthEnd)
    .in("status", ["pending", "paid", "confirmed", "completed"])
    .order("booking_date", { ascending: true });

  const bookings = (data ?? []) as Booking[];

  return (
    <main className="mx-auto max-w-7xl p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Calendar</h1>
          <p className="mt-1 text-gray-500">
            ดูคิวจองรายเดือนของ Nimman Foto
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          ← กลับ Dashboard
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={prevUrl}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            ← เดือนก่อนหน้า
          </Link>

          <div className="text-center">
  <h2 className="text-xl font-bold">
    {firstDay.toLocaleDateString("th-TH", {
      month: "long",
      year: "numeric",
    })}
  </h2>

  <Link
    href="/admin/calendar"
    className="mt-2 inline-block rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
  >
    เดือนปัจจุบัน
  </Link>
</div>

<Link
  href={nextUrl}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            เดือนถัดไป →
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border bg-green-100 px-3 py-1 text-green-700">
            ว่าง
          </span>
          <span className="rounded-full border bg-yellow-100 px-3 py-1 text-yellow-700">
            จองเช้า
          </span>
          <span className="rounded-full border bg-orange-100 px-3 py-1 text-orange-700">
            จองบ่าย
          </span>
          <span className="rounded-full border bg-red-100 px-3 py-1 text-red-700">
            เต็ม
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="grid grid-cols-7 bg-gray-50 text-center text-sm font-semibold text-gray-600">
          {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
            <div key={d} className="border-r p-3 last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[130px] border p-3" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(year, month, day);
            const dateKey = formatDateLocal(date);

            const dayBookings = bookings.filter(
              (b) => b.booking_date === dateKey
            );

            const status = getPeriodStatus(dayBookings);

            return (
              <div key={dateKey} className="min-h-[130px] border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{day}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {dayBookings.map((b) => (
                    <Link
                      key={b.id}
                      href={`/admin/bookings/${b.id}`}
                      className="block rounded-lg bg-gray-50 p-2 text-xs hover:bg-gray-100"
                    >
                      <div className="font-semibold">
                        {b.period === "morning" ? "🌅 เช้า" : "🌇 บ่าย"}
                      </div>
                      <div>
                        {b.start_time && b.end_time
                          ? `${b.start_time} - ${b.end_time}`
                          : "-"}
                      </div>
                      <div className="truncate text-gray-500">
                        {b.fullname}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}