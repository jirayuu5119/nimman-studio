"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Booking } from "@/types/booking";
import StatusBadge from "./StatusBadge";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Search,
  Download,
  FileSpreadsheet,
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

function escapeCsvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
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

  const exportCSV = () => {
    const headers = [
      "Booking No",
      "Customer",
      "Phone",
      "Date",
      "Time",
      "Total Price",
      "Deposit Amount",
      "Remaining Amount",
      "Status",
      "Slip URL",
    ];

    const rows = bookings.map((b) => [
      b.booking_no,
      b.fullname,
      b.phone,
      b.booking_date,
      displayTime(b),
      b.total_price ?? 0,
      b.deposit_amount ?? 0,
      b.remaining_amount ?? 0,
      b.status,
      b.slip_url ?? "",
    ]);

    const csv = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((r) => r.map(escapeCsvCell).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "bookings.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const data = bookings.map((b) => ({
      "Booking No": b.booking_no,
      Customer: b.fullname,
      Phone: b.phone,
      Date: b.booking_date,
      Time: displayTime(b),
      "Total Price": b.total_price ?? 0,
      "Deposit Amount": b.deposit_amount ?? 0,
      "Remaining Amount": b.remaining_amount ?? 0,
      Status: b.status,
      "Slip URL": b.slip_url ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Bookings");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, "bookings.xlsx");
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto_auto]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
            />

            <input
              className="w-full rounded-full border border-stone-200 bg-stone-50 px-11 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ค้นหาเลขจอง / ชื่อลูกค้า / เบอร์โทร"
            />
          </div>

          <select
            className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-900 focus:bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="draft">Draft</option>
          </select>

          <button
            onClick={exportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
          >
            <Download size={17} />
            CSV
          </button>

          <button
            onClick={exportExcel}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-stone-900"
          >
            <FileSpreadsheet size={17} />
            Excel
          </button>
        </div>
      </div>

      <div className="md:hidden">
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="rounded-[1.5rem] border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
              ไม่พบข้อมูลการจอง
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                      Booking
                    </div>

                    <div className="mt-1 font-semibold text-stone-900">
                      {b.booking_no}
                    </div>
                  </div>

                  <StatusBadge status={b.status} />
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-stone-400">Customer</div>
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
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-stone-900"
                >
                  <Eye size={17} />
                  ดูรายละเอียด
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.04)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-sm">
            <thead className="border-b border-stone-200 bg-stone-50/80 text-stone-500">
              <tr>
                <th className="px-5 py-4 text-left font-medium">Booking</th>
                <th className="px-5 py-4 text-left font-medium">Customer</th>
                <th className="px-5 py-4 text-left font-medium">Phone</th>
                <th className="px-5 py-4 text-left font-medium">Date</th>
                <th className="px-5 py-4 text-left font-medium">Time</th>
                <th className="px-5 py-4 text-left font-medium">Status</th>
                <th className="px-5 py-4 text-center font-medium">Action</th>
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
                    className="border-b border-stone-100 transition last:border-b-0 hover:bg-stone-50/80"
                  >
                    <td className="px-5 py-4 font-semibold text-stone-900">
                      {b.booking_no}
                    </td>

                    <td className="px-5 py-4 text-stone-700">
                      {b.fullname}
                    </td>

                    <td className="px-5 py-4 text-stone-700">
                      {b.phone}
                    </td>

                    <td className="px-5 py-4 text-stone-700">
                      {b.booking_date}
                    </td>

                    <td className="px-5 py-4 font-medium text-stone-900">
                      {displayTime(b)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} />
                    </td>

                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-stone-900"
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

      <div className="flex items-center justify-between rounded-[1.5rem] border border-stone-200 bg-white/90 px-4 py-4 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
        <button
          disabled={currentPage <= 1}
          onClick={() => goToPage(currentPage - 1)}
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 font-semibold text-stone-700 transition hover:border-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          ก่อนหน้า
        </button>

        <div className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
          Page {currentPage} / {totalPages || 1}
        </div>

        <button
          disabled={currentPage >= totalPages || totalPages <= 1}
          onClick={() => goToPage(currentPage + 1)}
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 font-semibold text-stone-700 transition hover:border-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ถัดไป
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}
