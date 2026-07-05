"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type BookedSlot = {
  booking_date: string;
  period: "morning" | "afternoon";
  status: string;
};

type Props = {
  selected: Date | null;
  bookedSlots: BookedSlot[];
  onSelect: (date: Date | null) => void;
};

export default function Calendar({
  selected,
  bookedSlots,
  onSelect,
}: Props) {
  const disabledDays = bookedSlots
    .reduce((dates, slot) => {
      const existing = dates[slot.booking_date] ?? {
        morning: false,
        afternoon: false,
      };

      existing[slot.period] = true;
      dates[slot.booking_date] = existing;

      return dates;
    }, {} as Record<string, { morning: boolean; afternoon: boolean }>);

  const fullyBooked = Object.entries(disabledDays)
    .filter(
      ([, value]) => value.morning && value.afternoon
    )
    .map(([date]) => new Date(date));

  return (
    <div className="rounded-xl border p-4">
      <DayPicker
        mode="single"
        selected={selected ?? undefined}
        onSelect={(date) => onSelect(date ?? null)}
        disabled={fullyBooked}
      />
    </div>
  );
}