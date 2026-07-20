"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Booking } from "@/types/booking";
import StatusBadge from "./StatusBadge";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
  CalendarDays,
  Clock3,
} from "lucide-react";

type Props = {
  bookings: Booking[];
  currentPage: number;
  totalPages: number;
  search: string;
  status: string;
};

function displayTime(b: Booking) {
  if (b.start_time && b.end_time) {
    return `${b.start_time} - ${b.end_time}`;
  }

  return b.period === "morning" ? "รอบเช้า" : "รอบบ่าย";
}

export default function AdminTable({
  bookings,
  currentPage,
  totalPages,
  search,
  status,
}: Props) {
  const router = useRouter();
  const firstRender = useRef(true);

  const [searchText, setSearchText] = useState(search);
  const [statusFilter, setStatusFilter] = useState(status);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const t = setTimeout(() => {
      const params = new URLSearchParams();

      params.set("page", "1");

      if (searchText.trim()) {
        params.set("q", searchText.trim());
      }

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      router.push(`/admin?${params.toString()}`);
    }, 300);

    return () => clearTimeout(t);
  }, [searchText, statusFilter, router]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams();

    params.set("page", String(page));

    if (searchText.trim()) {
      params.set("q", searchText.trim());
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    router.push(`/admin?${params.toString()}`);
  };

  const exportParams = new URLSearchParams();
  if (search.trim()) exportParams.set("q", search.trim());
  if (status !== "all") exportParams.set("status", status);
  const exportUrl = `/api/admin/bookings/export?${exportParams.toString()}`;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]"
            />

            <input
              aria-label="ค้นหารายการจอง"
              className="min-h-11 w-full rounded-xl border border-[var(--admin-border)] bg-white px-10 py-2.5 text-sm text-[var(--admin-text)] outline-none placeholder:text-stone-400"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ค้นหาเลขจอง / ชื่อลูกค้า / เบอร์โทร"
            />
          </div>

          <select
            aria-label="กรองตามสถานะ"
            className="min-h-11 rounded-xl border border-[var(--admin-border)] bg-white px-3.5 text-sm text-[var(--admin-text)] outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอตรวจสอบ</option>
            <option value="paid">ชำระแล้ว</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
            <option value="draft">แบบร่าง</option>
          </select>

          <a
            href={exportUrl}
            className="admin-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] bg-white px-4 text-sm font-semibold text-[var(--admin-text)] transition hover:border-[var(--admin-accent)]"
          >
            <Download size={17} />
            CSV ทั้งหมด
          </a>
        </div>
      </div>

      <div className="md:hidden">
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-8 text-center text-sm text-[var(--admin-muted)]">
              ไม่พบข้อมูลการจอง
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-[var(--admin-border)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                      เลขจอง
                    </div>

                    <div className="mt-1 font-semibold text-stone-900">
                      {b.booking_no}
                    </div>
                  </div>

                  <StatusBadge status={b.status} />
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-stone-400">ลูกค้า</div>
                    <div className="mt-1 font-medium text-stone-900">
                      {b.fullname}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-stone-600">
                    <Phone size={16} className="text-stone-400" />
                    {b.phone}
                  </div>

                  <div className="flex items-center gap-2 text-stone-600">
                    <CalendarDays size={16} className="text-stone-400" />
                    {b.booking_date}
                  </div>

                  <div className="flex items-center gap-2 text-stone-600">
                    <Clock3 size={16} className="text-stone-400" />
                    {displayTime(b)}
                  </div>
                </div>

                <Link
                  href={`/admin/bookings/${b.id}`}
                  className="admin-focus mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--admin-sidebar)] px-4 text-sm font-semibold text-white"
                >
                  <Eye size={17} />
                  ดูรายละเอียด
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-[var(--admin-border)] bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-sm">
            <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">เลขจอง</th>
                <th className="px-4 py-3 text-left font-semibold">ลูกค้า</th>
                <th className="px-4 py-3 text-left font-semibold">เบอร์โทร</th>
                <th className="px-4 py-3 text-left font-semibold">วันที่</th>
                <th className="px-4 py-3 text-left font-semibold">เวลา</th>
                <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-center font-semibold">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-stone-500">
                    ไม่พบข้อมูลการจอง
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[var(--admin-border)] transition last:border-b-0 hover:bg-[var(--admin-surface-muted)]"
                  >
                    <td className="px-4 py-3 font-semibold text-[var(--admin-text)]">
                      {b.booking_no}
                    </td>

                    <td className="px-4 py-3 text-stone-700">
                      {b.fullname}
                    </td>

                    <td className="px-4 py-3 text-stone-700">
                      {b.phone}
                    </td>

                    <td className="px-4 py-3 text-stone-700">
                      {b.booking_date}
                    </td>

                    <td className="px-4 py-3 font-medium text-stone-900">
                      {displayTime(b)}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="admin-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--admin-border)] bg-white px-3 text-xs font-semibold text-[var(--admin-text)] transition hover:border-[var(--admin-accent)]"
                      >
                        <Eye size={15} />
                        ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3 py-3 text-sm">
        <button
          disabled={currentPage <= 1}
          aria-label="ไปหน้าก่อนหน้า"
          onClick={() => goToPage(currentPage - 1)}
          className="admin-focus inline-flex min-h-10 items-center gap-1 rounded-xl border border-[var(--admin-border)] bg-white px-3 font-semibold text-stone-700 transition hover:border-[var(--admin-accent)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          ก่อนหน้า
        </button>

        <div className="text-xs font-medium text-[var(--admin-muted)]">
          หน้า {currentPage} / {totalPages || 1}
        </div>

        <button
          disabled={currentPage >= totalPages || totalPages <= 1}
          aria-label="ไปหน้าถัดไป"
          onClick={() => goToPage(currentPage + 1)}
          className="admin-focus inline-flex min-h-10 items-center gap-1 rounded-xl border border-[var(--admin-border)] bg-white px-3 font-semibold text-stone-700 transition hover:border-[var(--admin-accent)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ถัดไป
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
