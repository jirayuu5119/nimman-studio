import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";
import RecentBookings from "./RecentBookings";
import StatCard from "./StatCard";
import RevenueChart from "./RevenueChart";
import { createClient } from "@supabase/supabase-js";
import AdminTable from "./AdminTable";
import { Booking } from "@/types/booking";
import {
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  Clock3,
  BadgeCheck,
  CircleX,
} from "lucide-react";

const PAGE_SIZE = 10;
const REVENUE_STATUSES = ["paid", "confirmed", "completed"];

type AnalyticsBooking = {
  status: string | null;
  total_price: number | null;
  booking_date: string | null;
};

function getBangkokDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return {
    dateKey: `${year}-${month}-${day}`,
    monthKey: `${year}-${month}`,
  };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? 1));
  const q = params.q ?? "";
  const status = params.status ?? "all";

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = supabase.from("bookings").select("*", {
    count: "exact",
  });

  if (q) {
    query = query.or(
      `booking_no.ilike.%${q}%,fullname.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: bookings, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const bookingList = (bookings ?? []) as Booking[];

  const { data: allBookings } = await supabase
    .from("bookings")
    .select("status,total_price,booking_date")
    .order("booking_date", { ascending: true })
    .range(0, 9999);

  const analyticsBookings = (allBookings ?? []) as AnalyticsBooking[];

  const analytics = {
    totalRevenue: 0,
    totalBookings: analyticsBookings.length,
    pending: 0,
    paid: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    thisMonth: 0,
  };

  const { dateKey: todayKey, monthKey: thisMonthKey } =
    getBangkokDateParts(new Date());

  analyticsBookings.forEach((b) => {
    const bookingDate = b.booking_date ?? "";

    if (b.status && REVENUE_STATUSES.includes(b.status)) {
      analytics.totalRevenue += b.total_price ?? 0;
    }

    if (b.status === "pending") analytics.pending++;
    if (b.status === "paid") analytics.paid++;
    if (b.status === "confirmed") analytics.confirmed++;
    if (b.status === "completed") analytics.completed++;
    if (b.status === "cancelled") analytics.cancelled++;

    if (bookingDate === todayKey) {
      analytics.today++;
    }

    if (bookingDate.startsWith(thisMonthKey)) {
      analytics.thisMonth++;
    }
  });

  type ChartItem = {
    date: string;
    revenue: number;
  };

  const chartData = Object.values(
    analyticsBookings.reduce<Record<string, ChartItem>>((acc, b) => {
      const date = b.booking_date;

      if (!date) {
        return acc;
      }

      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
        };
      }

      if (b.status && REVENUE_STATUSES.includes(b.status)) {
        acc[date].revenue += b.total_price ?? 0;
      }

      return acc;
    }, {})
  ).sort(
    (a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-stone-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
              Nimman Foto Admin
            </p>

            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
              Admin Dashboard
            </h1>

            <p className="mt-3 text-sm leading-6 text-stone-500">
              จัดการรายการจอง ตรวจสอบยอด และอัปเดตสถานะการจอง
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <LogoutButton />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3 rounded-[1.5rem] border border-stone-200/80 bg-white/80 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.04)] backdrop-blur">
          <Link
            href="/admin"
            className="rounded-full border border-stone-900 bg-stone-900 px-5 py-3 text-sm font-semibold tracking-[0.08em] text-white transition hover:bg-white hover:text-stone-900"
          >
            Bookings
          </Link>

          <Link
            href="/admin/calendar"
            className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold tracking-[0.08em] text-stone-700 transition hover:border-stone-900"
          >
            Calendar
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard
            title="Today Shoots"
            value={analytics.today}
            icon={<CalendarDays size={22} className="text-white" />}
            color="bg-stone-900"
          />

          <StatCard
            title="This Month"
            value={analytics.thisMonth}
            icon={<CalendarRange size={22} className="text-white" />}
            color="bg-stone-800"
          />

          <StatCard
            title="Revenue"
            value={`฿${analytics.totalRevenue.toLocaleString()}`}
            icon={<CircleDollarSign size={22} className="text-white" />}
            color="bg-emerald-700"
          />

          <StatCard
            title="Pending"
            value={analytics.pending}
            icon={<Clock3 size={22} className="text-white" />}
            color="bg-amber-500"
          />

          <StatCard
            title="Confirmed"
            value={analytics.confirmed}
            icon={<BadgeCheck size={22} className="text-white" />}
            color="bg-green-700"
          />

          <StatCard
            title="Cancelled"
            value={analytics.cancelled}
            icon={<CircleX size={22} className="text-white" />}
            color="bg-rose-500"
          />
        </div>

        <div className="mb-8 rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-6">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                Analytics
              </p>

              <h2 className="mt-2 text-xl font-semibold text-stone-900">
                Revenue Trend
              </h2>
            </div>

            <p className="text-sm text-stone-500">
              รายได้จากรายการที่ยืนยันแล้ว
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-4">
            <RevenueChart
              data={
                chartData as {
                  date: string;
                  revenue: number;
                }[]
              }
            />
          </div>
        </div>

        <div className="mb-8">
          <RecentBookings bookings={bookingList} />
        </div>

        <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-6">
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
              Booking Management
            </p>

            <h2 className="mt-2 text-xl font-semibold text-stone-900">
              รายการจองทั้งหมด
            </h2>
          </div>

          <AdminTable
            bookings={bookingList}
            currentPage={page}
            totalPages={Math.max(
              1,
              Math.ceil((count ?? 0) / PAGE_SIZE)
            )}
            search={q}
            status={status}
          />
        </div>
      </div>
    </main>
  );
}
