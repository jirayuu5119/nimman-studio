import type { BookingPeriod } from "@/types/booking";

export type TimeSlot = {
  period: BookingPeriod;
  startTime: string;
  endTime: string;
  label: string;
};

export function getTimeSlots(
  period: BookingPeriod | null,
  hours: 3 | 4
): TimeSlot[] {
  if (!period) return [];

  if (period === "morning") {
    if (hours === 3) {
      return [
        { period, startTime: "07:00", endTime: "10:00", label: "07:00 - 10:00" },
        { period, startTime: "08:00", endTime: "11:00", label: "08:00 - 11:00" },
        { period, startTime: "09:00", endTime: "12:00", label: "09:00 - 12:00" },
      ];
    }

    return [
      { period, startTime: "07:00", endTime: "11:00", label: "07:00 - 11:00" },
      { period, startTime: "08:00", endTime: "12:00", label: "08:00 - 12:00" },
    ];
  }

  if (hours === 3) {
    return [
      { period, startTime: "13:00", endTime: "16:00", label: "13:00 - 16:00" },
      { period, startTime: "14:00", endTime: "17:00", label: "14:00 - 17:00" },
      { period, startTime: "15:00", endTime: "18:00", label: "15:00 - 18:00" },
    ];
  }

  return [
    { period, startTime: "13:00", endTime: "17:00", label: "13:00 - 17:00" },
    { period, startTime: "14:00", endTime: "18:00", label: "14:00 - 18:00" },
  ];
}