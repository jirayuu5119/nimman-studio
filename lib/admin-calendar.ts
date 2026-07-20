import type { BookingPeriod } from "@/types/booking";

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
