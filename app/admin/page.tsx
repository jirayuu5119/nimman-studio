import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";
import SectionTitle from "@/components/admin/SectionTitle";
import RecentBookings from "@/components/admin/RecentBookings";
import StatCard from "@/components/admin/StatCard";
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

  const page = Number(params.page ?? 1);
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
    .select("status,total_price,created_at")
    .limit(2000);

  const analytics = {
    totalRevenue: 0,
    totalBookings: allBookings?.length ?? 0,
    pending: 0,
    paid: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    thisMonth: 0,
  };

  const now = new Date();
  const todayStr = now.toDateString();

  (allBookings ?? []).forEach((b) => {
    const createdAt = new Date(b.created_at);

    if (
      b.status === "paid" ||
      b.status === "confirmed" ||
      b.status === "completed"
    ) {
      analytics.totalRevenue += b.total_price ?? 0;
    }

    if (b.status === "pending") analytics.pending++;
    if (b.status === "paid") analytics.paid++;
    if (b.status === "confirmed") analytics.confirmed++;
    if (b.status === "completed") analytics.completed++;
    if (b.status === "cancelled") analytics.cancelled++;

    if (createdAt.toDateString() === todayStr) {
      analytics.today++;
    }

    if (
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear()
    ) {
      analytics.thisMonth++;
    }
  });

  type ChartItem = {
  date: string;
  revenue: number;
};

const chartData = Object.values(
  (allBookings ?? []).reduce<Record<string, ChartItem>>((acc, b) => {
      const date = new Date(b.created_at).toISOString().split("T")[0];

      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
        };
      }

      if (
        b.status === "paid" ||
        b.status === "confirmed" ||
        b.status === "completed"
      ) {
        acc[date].revenue += b.total_price ?? 0;
      }

      return acc;
    }, {})
  ).sort(
  (a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
);

  return (
  <main className="min-h-screen bg-stone-100 px-6 py-8">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <SectionTitle
          title="Admin Dashboard"
          subtitle="จัดการระบบจอง Nimman Foto"
        />

        <LogoutButton />
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/admin"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Bookings
        </Link>

        <Link
          href="/admin/calendar"
          className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Calendar
        </Link>
      </div>

      <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Today's Booking"
          value={analytics.today}
          icon={<CalendarDays size={24} className="text-white" />}
          color="bg-blue-600"
        />

        <StatCard
          title="This Month"
          value={analytics.thisMonth}
          icon={<CalendarRange size={24} className="text-white" />}
          color="bg-violet-600"
        />

        <StatCard
          title="Revenue"
          value={`฿${analytics.totalRevenue.toLocaleString()}`}
          icon={<CircleDollarSign size={24} className="text-white" />}
          color="bg-emerald-600"
        />

        <StatCard
          title="Pending"
          value={analytics.pending}
          icon={<Clock3 size={24} className="text-white" />}
          color="bg-amber-500"
        />

        <StatCard
          title="Confirmed"
          value={analytics.confirmed}
          icon={<BadgeCheck size={24} className="text-white" />}
          color="bg-green-600"
        />

        <StatCard
          title="Cancelled"
          value={analytics.cancelled}
          icon={<CircleX size={24} className="text-white" />}
          color="bg-red-600"
        />
      </div>

      <div className="mb-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-stone-800">
          Revenue Trend
        </h2>

        <RevenueChart
          data={
            chartData as {
              date: string;
              revenue: number;
            }[]
          }
        />
      </div>

      <div className="mb-8">
        <RecentBookings bookings={bookingList} />
      </div>

      <AdminTable
        bookings={bookingList}
        currentPage={page}
        totalPages={Math.ceil((count ?? 0) / PAGE_SIZE)}
        search={q}
        status={status}
      />
    </div>
  </main>
);
}