import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  CircleX,
  Clock3,
  ExternalLink,
  Eye,
  Link2,
  QrCode,
  Upload,
} from "lucide-react";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { AdminStatusBanner } from "@/components/admin/AdminStatusBanner";
import {
  normalizeAdminBookingSearch,
  normalizeAdminBookingStatus,
} from "@/lib/admin-booking-filters";
import { normalizeDashboardAnalytics } from "@/lib/admin-dashboard";
import { parseCustomerDataRetentionDays } from "@/lib/privacy";
import { getSiteSettings, type SiteSettings } from "@/lib/siteSettings";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Booking } from "@/types/booking";
import AdminTable from "./AdminTable";
import RecentBookings from "./RecentBookings";
import RevenueChart from "./RevenueChart";
import StatCard from "./StatCard";
import { updatePaymentSettings, updatePortfolioLinks } from "./actions";

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
  const requestedPage = Number(params.page ?? 1);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, 100_000)
      : 1;
  const q = normalizeAdminBookingSearch(params.q);
  const status = normalizeAdminBookingStatus(params.status);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createAdminClient();
  let query = supabase.from("bookings").select("*", { count: "exact" });

  if (q) {
    query = query.or(
      `booking_no.ilike.%${q}%,fullname.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  if (status !== "all") query = query.eq("status", status);

  const { data: bookings, count, error: bookingsError } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (bookingsError) throw bookingsError;

  const bookingList = (bookings ?? []) as Booking[];
  const bookingViewsSinceDate = new Date();
  bookingViewsSinceDate.setHours(bookingViewsSinceDate.getHours() - 24);
  const bookingViewsSince = bookingViewsSinceDate.toISOString();

  const [
    analyticsResult,
    siteSettings,
    bookingViewsResult,
    exhaustedNotificationsResult,
  ] = await Promise.all([
    supabase.rpc("get_booking_dashboard_analytics"),
    getSiteSettings(supabase),
    supabase
      .from("page_visitors")
      .select("visitor_hash", { count: "exact", head: true })
      .eq("page", "booking")
      .gte("last_seen_at", bookingViewsSince),
    supabase
      .from("notification_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("attempts", 8),
  ]);

  if (analyticsResult.error) throw analyticsResult.error;
  if (bookingViewsResult.error) throw bookingViewsResult.error;
  if (exhaustedNotificationsResult.error) {
    throw exhaustedNotificationsResult.error;
  }

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
  const exhaustedNotifications = exhaustedNotificationsResult.count ?? 0;
  const retentionDays = parseCustomerDataRetentionDays(
    process.env.CUSTOMER_DATA_RETENTION_DAYS
  );

  return (
    <main className="min-h-screen px-3 py-4 sm:px-5 sm:py-5 lg:px-7 xl:px-8">
      <div className="mx-auto max-w-[1540px] space-y-4">
        <AdminHeader />

        <AdminStatusBanner
          failedNotifications={exhaustedNotifications}
          retentionDays={retentionDays}
        />

        <section aria-label="สรุปข้อมูลการจอง" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <StatCard
            title="งานวันนี้"
            value={analytics.today}
            detail="งาน"
            tone="neutral"
            icon={<CalendarDays aria-hidden="true" size={18} />}
          />
          <StatCard
            title="งานเดือนนี้"
            value={analytics.thisMonth}
            detail="งาน"
            tone="success"
            icon={<CalendarRange aria-hidden="true" size={18} />}
          />
          <StatCard
            title="รายได้รวม"
            value={`฿${analytics.totalRevenue.toLocaleString("th-TH")}`}
            detail="บาท"
            tone="success"
            icon={<CircleDollarSign aria-hidden="true" size={18} />}
          />
          <StatCard
            title="รอตรวจสอบ"
            value={analytics.pending}
            detail="รายการ"
            tone="warning"
            icon={<Clock3 aria-hidden="true" size={18} />}
          />
          <StatCard
            title="ยืนยันแล้ว"
            value={analytics.confirmed}
            detail="รายการ"
            tone="success"
            icon={<BadgeCheck aria-hidden="true" size={18} />}
          />
          <StatCard
            title="ยกเลิก"
            value={analytics.cancelled}
            detail="รายการ"
            tone="danger"
            icon={<CircleX aria-hidden="true" size={18} />}
          />
          <StatCard
            title="ผู้เข้าชม 24 ชม."
            value={bookingViews24h}
            detail="คน"
            tone="info"
            icon={<Eye aria-hidden="true" size={18} />}
          />
        </section>

        <AdminQuickActions />

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
          <div className="space-y-4">
            <section
              id="portfolio"
              aria-labelledby="portfolio-heading"
              className="admin-panel admin-section p-4 sm:p-5"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--admin-accent)]">ลิงก์ผลงาน</p>
                  <h2 id="portfolio-heading" className="mt-1 text-lg font-bold">
                    ปุ่มชมผลงานบนหน้าเว็บจอง
                  </h2>
                </div>
                <Link
                  href="/booking"
                  target="_blank"
                  rel="noreferrer"
                  className="admin-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] px-3.5 text-sm font-semibold hover:border-[var(--admin-accent)]"
                >
                  <ExternalLink aria-hidden="true" size={16} />
                  เปิดหน้าเว็บจอง
                </Link>
              </div>

              <form action={updatePortfolioLinks} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                <label className="block text-sm font-medium">
                  ลิงก์ Instagram
                  <input
                    name="instagramUrl"
                    defaultValue={siteSettingsData.instagram_url ?? ""}
                    placeholder="https://www.instagram.com/..."
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3.5 text-sm outline-none focus:bg-white"
                  />
                </label>
                <label className="block text-sm font-medium">
                  ลิงก์ Facebook
                  <input
                    name="facebookUrl"
                    defaultValue={siteSettingsData.facebook_url ?? ""}
                    placeholder="https://www.facebook.com/..."
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3.5 text-sm outline-none focus:bg-white"
                  />
                </label>
                <button
                  type="submit"
                  className="admin-focus inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl bg-[var(--admin-sidebar)] px-4 text-sm font-semibold text-white hover:bg-black"
                >
                  <Link2 aria-hidden="true" size={16} />
                  บันทึกลิงก์
                </button>
              </form>
            </section>

            <section
              id="payments"
              aria-labelledby="payments-heading"
              className="admin-panel admin-section p-4 sm:p-5"
            >
              <div className="mb-4 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                  <QrCode aria-hidden="true" size={20} />
                </span>
                <div>
                  <p className="text-xs font-medium text-[var(--admin-accent)]">การรับชำระเงิน</p>
                  <h2 id="payments-heading" className="mt-1 text-lg font-bold">
                    PromptPay และรูป QR รับโอน
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                    รูปเดิมจะยังใช้งานต่อหากไม่ได้เลือกไฟล์ใหม่
                  </p>
                </div>
              </div>

              <form action={updatePaymentSettings} className="grid gap-4 md:grid-cols-[180px_1fr]">
                <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-2.5">
                  <Image
                    src={promptpayQrPreview}
                    alt="QR PromptPay ปัจจุบัน"
                    width={320}
                    height={320}
                    unoptimized
                    className="h-auto w-full rounded-lg bg-white object-contain"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    เลข PromptPay
                    <input
                      name="promptpayNumber"
                      inputMode="numeric"
                      required
                      minLength={10}
                      maxLength={15}
                      defaultValue={siteSettingsData.promptpay_number}
                      placeholder="กรอกเลข PromptPay 10-15 หลัก"
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3.5 text-sm outline-none focus:bg-white"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    รูป QR / รูปรับโอนเงิน
                    <input
                      name="promptpayQr"
                      type="file"
                      accept="image/jpeg,image/png"
                      className="mt-1.5 block min-h-11 w-full rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--admin-sidebar)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
                    />
                  </label>
                  <p className="text-xs text-[var(--admin-muted)]">
                    รองรับ JPG หรือ PNG ขนาดไม่เกิน 3 MB
                  </p>
                  <button
                    type="submit"
                    className="admin-focus inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--admin-sidebar)] px-4 text-sm font-semibold text-white hover:bg-black sm:w-auto"
                  >
                    <Upload aria-hidden="true" size={16} />
                    บันทึกข้อมูลการรับเงิน
                  </button>
                </div>
              </form>
            </section>
          </div>

          <section id="security" className="admin-section">
            <ChangePasswordForm />
          </section>
        </div>

        <section id="revenue" aria-labelledby="revenue-heading" className="admin-panel admin-section p-4 sm:p-5">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--admin-accent)]">สถิติรายได้</p>
              <h2 id="revenue-heading" className="mt-1 text-lg font-bold">แนวโน้มรายได้</h2>
            </div>
            <p className="text-xs text-[var(--admin-muted)]">ข้อมูลช่วงเวลาที่ backend รองรับปัจจุบัน</p>
          </div>
          <RevenueChart
            data={analytics.chartData}
            totalRevenue={analytics.totalRevenue}
            confirmedCount={analytics.confirmed}
          />
        </section>

        <RecentBookings bookings={bookingList} />

        <section
          id="bookings"
          aria-labelledby="bookings-heading"
          className="admin-panel admin-section p-3 sm:p-5"
        >
          <div className="mb-4 px-1">
            <p className="text-xs font-medium text-[var(--admin-accent)]">จัดการรายการจอง</p>
            <h2 id="bookings-heading" className="mt-1 text-lg font-bold">รายการจองทั้งหมด</h2>
          </div>
          <AdminTable
            bookings={bookingList}
            currentPage={page}
            totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))}
            search={q}
            status={status}
          />
        </section>
      </div>
    </main>
  );
}
