import Link from "next/link";
import Image from "next/image";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";
import LogoutButton from "@/components/admin/LogoutButton";
import { updatePaymentSettings, updatePortfolioLinks } from "./actions";
import RecentBookings from "./RecentBookings";
import StatCard from "./StatCard";
import RevenueChart from "./RevenueChart";
import AdminTable from "./AdminTable";
import {
  normalizeAdminBookingSearch,
  normalizeAdminBookingStatus,
} from "@/lib/admin-booking-filters";
import { getSiteSettings, type SiteSettings } from "@/lib/siteSettings";
import { createAdminClient } from "@/lib/supabase/admin";
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
  QrCode,
  Upload,
} from "lucide-react";

const PAGE_SIZE = 10;
type ChartItem = { date: string; revenue: number };

type DashboardAnalytics = {
  totalRevenue: number;
  totalBookings: number;
  pending: number;
  paid: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  thisMonth: number;
  chartData: ChartItem[];
};

function normalizeDashboardAnalytics(value: unknown): DashboardAnalytics {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const numberValue = (key: string) => {
    const parsed = Number(data[key]);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const chartData = Array.isArray(data.chartData)
    ? data.chartData.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const revenue = Number(row.revenue);
        return typeof row.date === "string" && Number.isFinite(revenue)
          ? [{ date: row.date, revenue }]
          : [];
      })
    : [];

  return {
    totalRevenue: numberValue("totalRevenue"),
    totalBookings: numberValue("totalBookings"),
    pending: numberValue("pending"),
    paid: numberValue("paid"),
    confirmed: numberValue("confirmed"),
    completed: numberValue("completed"),
    cancelled: numberValue("cancelled"),
    today: numberValue("today"),
    thisMonth: numberValue("thisMonth"),
    chartData,
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

  const requestedPage = Number(params.page ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, 100_000)
    : 1;
  const q = normalizeAdminBookingSearch(params.q);
  const status = normalizeAdminBookingStatus(params.status);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createAdminClient();

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

  const { data: bookings, count, error: bookingsError } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (bookingsError) throw bookingsError;

  const bookingList = (bookings ?? []) as Booking[];
  const bookingViewsSinceDate = new Date();
  bookingViewsSinceDate.setHours(bookingViewsSinceDate.getHours() - 24);
  const bookingViewsSince = bookingViewsSinceDate.toISOString();

  const [analyticsResult, siteSettings, bookingViewsResult] =
    await Promise.all([
      supabase.rpc("get_booking_dashboard_analytics"),
      getSiteSettings(supabase),
      supabase
        .from("page_visitors")
        .select("visitor_hash", { count: "exact", head: true })
        .eq("page", "booking")
        .gte("last_seen_at", bookingViewsSince),
    ]);

  if (analyticsResult.error) throw analyticsResult.error;

  const analytics = normalizeDashboardAnalytics(analyticsResult.data);
  const siteSettingsData = siteSettings as SiteSettings;
  const { data: promptpayQrSigned } = siteSettingsData.promptpay_qr_path
    ? await supabase.storage
        .from("site-config")
        .createSignedUrl(siteSettingsData.promptpay_qr_path, 10 * 60)
    : { data: null };
  const promptpayQrPreview =
    promptpayQrSigned?.signedUrl ?? "/promptpay-qr.png";
  const bookingViews24h = bookingViewsResult.count ?? 0;

  const chartData = analytics.chartData;

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

        <div className="mb-8 rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-6">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700">
              <QrCode size={22} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                การรับชำระเงิน
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">
                PromptPay และรูป QR รับโอน
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                แก้เลข PromptPay หรืออัปโหลดรูป QR ใหม่ รูปเดิมจะยังใช้งานต่อหากไม่ได้เลือกไฟล์ใหม่
              </p>
            </div>
          </div>

          <form
            action={updatePaymentSettings}
            className="grid gap-5 lg:grid-cols-[220px_1fr]"
          >
            <div className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-50 p-3">
              <Image
                src={promptpayQrPreview}
                alt="QR PromptPay ปัจจุบัน"
                width={320}
                height={320}
                unoptimized
                className="h-auto w-full rounded-xl bg-white object-contain"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  เลข PromptPay
                </label>
                <input
                  name="promptpayNumber"
                  inputMode="numeric"
                  required
                  minLength={10}
                  maxLength={15}
                  defaultValue={siteSettingsData.promptpay_number}
                  placeholder="กรอกเลข PromptPay 10-15 หลัก"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  รูป QR / รูปรับโอนเงิน
                </label>
                <input
                  name="promptpayQr"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="block w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-600 file:mr-4 file:rounded-full file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-stone-900"
                />
                <p className="mt-2 text-xs text-stone-400">
                  รองรับ JPG หรือ PNG ขนาดไม่เกิน 3 MB
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex h-[46px] items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-stone-900"
              >
                <Upload size={17} />
                บันทึกข้อมูลการรับเงิน
              </button>
            </div>
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
