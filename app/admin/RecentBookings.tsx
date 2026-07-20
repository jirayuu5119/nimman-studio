import Link from "next/link";
import { Booking } from "@/types/booking";
import StatusBadge from "@/app/admin/StatusBadge";

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
    <section id="recent-bookings" aria-labelledby="recent-bookings-heading" className="admin-panel admin-section overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3.5 sm:px-5">
        <div>
          <h2 id="recent-bookings-heading" className="text-base font-bold tracking-tight text-[var(--admin-text)]">
            รายการจองล่าสุด
          </h2>
          <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
            แสดงสูงสุด 5 รายการล่าสุด
          </p>
        </div>

        <Link
          href="/admin#bookings"
          className="admin-focus rounded-lg px-2 py-1 text-sm font-semibold text-[var(--admin-accent)] transition hover:bg-[var(--admin-surface-muted)]"
        >
          ดูทั้งหมด
        </Link>
      </div>

      {recentBookings.length === 0 ? (
        <div className="p-6 text-center text-sm text-[var(--admin-muted)]">
          ยังไม่มีรายการจอง
        </div>
      ) : (
        <div className="divide-y divide-[var(--admin-border)]">
          {recentBookings.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-[var(--admin-surface-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[var(--admin-text)]">
                    {b.fullname}
                  </p>

                  <StatusBadge status={b.status} />
                </div>

                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--admin-muted)]">
                  <span>{b.booking_no}</span>
                  <span>{formatDate(b.booking_date)}</span>
                  <span>{displayPeriod(b.period)}</span>
                </div>
              </div>

              <Link
                href={`/admin/bookings/${b.id}`}
                className="admin-focus inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[var(--admin-border)] bg-white px-3.5 text-sm font-semibold text-[var(--admin-text)] transition hover:border-[var(--admin-accent)] sm:w-auto"
              >
                ดูรายละเอียด
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
