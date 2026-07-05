"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Booking } from "@/types/booking";
import StatusBadge from "./StatusBadge";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type Props = {
  bookings: Booking[];
  currentPage: number;
  totalPages: number;
  search: string;
  status: string;
};

export default function AdminTable({
  bookings,
  currentPage,
  totalPages,
  search,
  status,
}: Props) {
  const router = useRouter();

  const [searchText, setSearchText] = useState(search);
  const [statusFilter, setStatusFilter] = useState(status);

  useEffect(() => {
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
    const headers = ["Booking No", "Customer", "Phone", "Date", "Status"];

    const rows = bookings.map((b) => [
      b.booking_no,
      b.fullname,
      b.phone,
      b.booking_date,
      b.status,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );

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
      Status: b.status,
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
      {/* Controls */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-black"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ค้นหาเลขจอง / ชื่อลูกค้า / เบอร์โทร"
          />

          <select
            className="rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-black"
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
            className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Export CSV
          </button>

          <button
            onClick={exportExcel}
            className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 text-left font-medium">Booking</th>
                <th className="p-4 text-left font-medium">Customer</th>
                <th className="p-4 text-left font-medium">Phone</th>
                <th className="p-4 text-left font-medium">Date</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-center font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-gray-500"
                  >
                    ไม่พบข้อมูลการจอง
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t transition hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium text-gray-900">
                      {b.booking_no}
                    </td>
                    <td className="p-4 text-gray-700">{b.fullname}</td>
                    <td className="p-4 text-gray-700">{b.phone}</td>
                    <td className="p-4 text-gray-700">
                      {b.booking_date}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
                      >
                        ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-4 text-sm">
          <button
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ก่อนหน้า
          </button>

          <div className="text-gray-600">
            Page {currentPage} of {totalPages || 1}
          </div>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </section>
  );
}