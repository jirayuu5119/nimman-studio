import type { BookingPeriod } from "@/types/booking";

export type ResetCalendarDayState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const INITIAL_RESET_CALENDAR_DAY_STATE: ResetCalendarDayState = {
  status: "idle",
  message: "",
};

export function hasAdminBlockedSlots<T>(items: readonly T[]) {
  return items.length > 0;
}

export function getResetCalendarDayConfirmation(dateLabel: string) {
  return `ยืนยันเปิดคิวทั้งวันสำหรับ ${dateLabel}? คิวลูกค้าที่จองแล้วจะยังคงอยู่`;
}

export function getAdminDayStatus(
  hasMorning: boolean,
  hasAfternoon: boolean
) {
  if (hasMorning && hasAfternoon) {
    return { label: "เต็ม", tone: "full" as const };
  }
  if (hasMorning || hasAfternoon) {
    return {
      label: hasMorning ? "เช้าไม่ว่าง" : "บ่ายไม่ว่าง",
      tone: "partial" as const,
    };
  }
  return { label: "ว่าง", tone: "open" as const };
}

export function buildAdminPeriodMap<
  T extends { booking_date: string; period: BookingPeriod },
>(items: T[]) {
  return items.reduce<Record<string, { morning: boolean; afternoon: boolean }>>(
    (accumulator, item) => {
      accumulator[item.booking_date] ??= {
        morning: false,
        afternoon: false,
      };
      accumulator[item.booking_date][item.period] = true;
      return accumulator;
    },
    {}
  );
}
