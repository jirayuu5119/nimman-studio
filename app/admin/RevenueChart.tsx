"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type Props = {
  data: {
    date: string;
    revenue: number;
  }[];
  totalRevenue: number;
  confirmedCount: number;
};

export default function RevenueChart({
  data,
  totalRevenue,
  confirmedCount,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] px-4 text-center text-sm text-[var(--admin-muted)]">
        ยังไม่มีข้อมูลรายได้สำหรับแสดงกราฟ
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px]">
      <div className="h-72 min-w-0 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#e8e2d9" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#7b746b", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#7b746b", fontSize: 11 }} tickLine={false} axisLine={false} width={58} />
            <Tooltip
              formatter={(value) => [
                `฿${Number(value ?? 0).toLocaleString("th-TH")}`,
                "รายได้",
              ]}
              contentStyle={{
                border: "1px solid #e8e2d9",
                borderRadius: 12,
                boxShadow: "0 12px 32px rgba(68, 53, 38, 0.10)",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#806342"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#806342", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#201d19" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
          <p className="text-xs text-[var(--admin-muted)]">รายได้รวม</p>
          <p className="mt-1 text-xl font-bold">฿{totalRevenue.toLocaleString("th-TH")}</p>
        </div>
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
          <p className="text-xs text-[var(--admin-muted)]">ยืนยันแล้ว</p>
          <p className="mt-1 text-xl font-bold">{confirmedCount.toLocaleString("th-TH")}</p>
        </div>
      </div>
    </div>
  );
}
