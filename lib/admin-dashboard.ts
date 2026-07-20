export type AdminTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type ChartItem = { date: string; revenue: number };

export type DashboardAnalytics = {
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

const STATUS_PRESENTATION: Record<
  string,
  { label: string; tone: AdminTone }
> = {
  draft: { label: "แบบร่าง", tone: "neutral" },
  pending: { label: "รอตรวจสอบ", tone: "warning" },
  paid: { label: "ชำระแล้ว", tone: "info" },
  confirmed: { label: "ยืนยันแล้ว", tone: "success" },
  completed: { label: "เสร็จสิ้น", tone: "info" },
  cancelled: { label: "ยกเลิก", tone: "danger" },
};

export function getAdminStatusPresentation(status: string) {
  return STATUS_PRESENTATION[status] ?? { label: status, tone: "neutral" as const };
}

export function getOperationalStatus(failedNotifications: number) {
  if (failedNotifications > 0) {
    return {
      tone: "warning" as const,
      title: `มีการแจ้งเตือนส่งไม่สำเร็จ ${failedNotifications} รายการ`,
      description:
        "ตรวจสอบ operational webhook และบันทึกการทำงานก่อนการแจ้งเตือนรอบถัดไป",
    };
  }

  return {
    tone: "success" as const,
    title: "ระบบแจ้งเตือนพร้อมทำงาน",
    description:
      "Cron ทำงานวันละครั้งและแจ้ง operational webhook เมื่อเกิดข้อผิดพลาด",
  };
}

export function normalizeDashboardAnalytics(value: unknown): DashboardAnalytics {
  const data =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
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
