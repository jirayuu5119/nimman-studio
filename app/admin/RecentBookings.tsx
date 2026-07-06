import Link from "next/link";
import { Booking } from "@/types/booking";
import StatusBadge from "./StatusBadge";

type Props = {
  bookings: Booking[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function displayPeriod(period: string) {
  if (period === "morning") return "รอบเช้า";
  if (period === "afternoon") return "รอบบ่าย";
  return period;
}

export default function RecentBookings({ bookings }: Props) {
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-100 p-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Recent Bookings
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            รายการจองล่าสุด
          </p>
        </div>

        <Link
          href="/admin"
          className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
        >
          ดูทั้งหมด
        </Link>
      </div>

      {recentBookings.length === 0 ? (
        <div className="p-6 text-center text-sm text-neutral-500">
          ยังไม่มีรายการจอง
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {recentBookings.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-4 p-5 transition hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-neutral-900">
                    {b.fullname}
                  </p>

                  <StatusBadge status={b.status} />
                </div>

                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-neutral-500">
                  <span>{b.booking_no}</span>
                  <span>{formatDate(b.booking_date)}</span>
                  <span>{displayPeriod(b.period)}</span>
                </div>
              </div>

              <Link
                href={`/admin/bookings/${b.id}`}
                className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 sm:w-auto"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}