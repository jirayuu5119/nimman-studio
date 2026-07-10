import Link from "next/link";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";
import LogoutButton from "@/components/admin/LogoutButton";
import { updatePortfolioLinks } from "./actions";
import RecentBookings from "./RecentBookings";
import StatCard from "./StatCard";
import RevenueChart from "./RevenueChart";
import { createClient } from "@supabase/supabase-js";
import AdminTable from "./AdminTable";
import { getSiteSettings, type SiteSettings } from "@/lib/siteSettings";
import { Booking } from "@/types/booking";
import {
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  Clock3,
  BadgeCheck,
  CircleX,
  ExternalLink,
  Eye,
  Link2,
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
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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
  const bookingViewsSinceDate = new Date();
  bookingViewsSinceDate.setHours(bookingViewsSinceDate.getHours() - 24);
  const bookingViewsSince = bookingViewsSinceDate.toISOString();

  const [allBookingsResult, siteSettings, bookingViewsResult] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("status,total_price,booking_date")
        .order("booking_date", { ascending: true })
        .range(0, 9999),
      getSiteSettings(supabase),
      supabase
        .from("page_views")
        .select("id", { count: "exact", head: true })
        .eq("page", "booking")
        .gte("created_at", bookingViewsSince),
    ]);

  if (allBookingsResult.error) {
    throw allBookingsResult.error;
  }

  if (bookingViewsResult.error) {
    console.error("Page views query error:", bookingViewsResult.error);
  }

  const analyticsBookings = (allBookingsResult.data ?? []) as AnalyticsBooking[];
  const siteSettingsData = siteSettings as SiteSettings;
  const bookingViews24h = bookingViewsResult.count ?? 0;

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
              ผู้ดูแลระบบ Nimman Foto
            </p>

            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
              แดชบอร์ดผู้ดูแล
            </h1>

            <p className="mt-3 text-sm leading-6 text-stone-500">
              จัดการรายการจอง ตรวจสอบยอด และอัปเดตสถานะการจอง
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900"
            >
              <ExternalLink size={16} />
              ดูหน้าเว็บจอง
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3 rounded-[1.5rem] border border-stone-200/80 bg-white/80 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.04)] backdrop-blur">
          <Link
            href="/admin"
            className="rounded-full border border-stone-900 bg-stone-900 px-5 py-3 text-sm font-semibold tracking-[0.08em] text-white transition hover:bg-white hover:text-stone-900"
          >
            รายการจอง
          </Link>

          <Link
            href="/admin/calendar"
            className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold tracking-[0.08em] text-stone-700 transition hover:border-stone-900"
          >
            ปฏิทินคิว
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <StatCard
            title="งานวันนี้"
            value={analytics.today}
            icon={<CalendarDays size={22} className="text-white" />}
            color="bg-stone-900"
          />

          <StatCard
            title="งานเดือนนี้"
            value={analytics.thisMonth}
            icon={<CalendarRange size={22} className="text-white" />}
            color="bg-stone-800"
          />

          <StatCard
            title="รายได้"
            value={`฿${analytics.totalRevenue.toLocaleString()}`}
            icon={<CircleDollarSign size={22} className="text-white" />}
            color="bg-emerald-700"
          />

          <StatCard
            title="รอตรวจสอบ"
            value={analytics.pending}
            icon={<Clock3 size={22} className="text-white" />}
            color="bg-amber-500"
          />

          <StatCard
            title="ยืนยันแล้ว"
            value={analytics.confirmed}
            icon={<BadgeCheck size={22} className="text-white" />}
            color="bg-green-700"
          />

          <StatCard
            title="ยกเลิก"
            value={analytics.cancelled}
            icon={<CircleX size={22} className="text-white" />}
            color="bg-rose-500"
          />

          <StatCard
            title="ผู้เข้าชม 24 ชม."
            value={bookingViews24h}
            icon={<Eye size={22} className="text-white" />}
            color="bg-sky-700"
          />
        </div>

        <div className="mb-8 rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                ลิงก์ผลงาน
              </p>

              <h2 className="mt-2 text-xl font-semibold text-stone-900">
                ปุ่มชมผลงานบนหน้าเว็บจอง
              </h2>
            </div>

            <Link
              href="/booking"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
            >
              <ExternalLink size={17} />
              เปิดหน้าเว็บจอง
            </Link>
          </div>

          <form action={updatePortfolioLinks} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                ลิงก์ Instagram
              </label>
              <input
                name="instagramUrl"
                defaultValue={siteSettingsData.instagram_url ?? ""}
                placeholder="https://www.instagram.com/..."
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                ลิงก์ Facebook
              </label>
              <input
                name="facebookUrl"
                defaultValue={siteSettingsData.facebook_url ?? ""}
                placeholder="https://www.facebook.com/..."
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="mt-7 inline-flex h-[46px] items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-stone-900"
            >
              <Link2 size={17} />
              บันทึกลิงก์
            </button>
          </form>
        </div>

        <ChangePasswordForm />

        <div className="mb-8 rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-6">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                สถิติรายได้
              </p>

              <h2 className="mt-2 text-xl font-semibold text-stone-900">
                แนวโน้มรายได้
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
              จัดการรายการจอง
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
