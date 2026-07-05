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

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function Calendar({
  selected,
  bookedSlots,
  onSelect,
}: Props) {
  function getDateStatus(date: Date) {
    const dateKey = formatDateLocal(date);

    const booked = bookedSlots.filter(
      (slot) => slot.booking_date === dateKey
    );

    const hasMorning = booked.some(
      (slot) => slot.period === "morning"
    );

    const hasAfternoon = booked.some(
      (slot) => slot.period === "afternoon"
    );

    if (hasMorning && hasAfternoon) return "full";
    if (hasMorning || hasAfternoon) return "almost";
    return "available";
  }

  const fullyBookedDays = bookedSlots
    .reduce((acc, slot) => {
      if (!acc[slot.booking_date]) {
        acc[slot.booking_date] = {
          morning: false,
          afternoon: false,
        };
      }

      acc[slot.booking_date][slot.period] = true;

      return acc;
    }, {} as Record<string, { morning: boolean; afternoon: boolean }>);

  const disabledDays = Object.entries(fullyBookedDays)
    .filter(([, value]) => value.morning && value.afternoon)
    .map(([date]) => new Date(date));

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <DayPicker
        mode="single"
        selected={selected ?? undefined}
        onSelect={(date) => onSelect(date ?? null)}
        disabled={disabledDays}
        components={{
          DayButton: (props) => {
            const status = getDateStatus(props.day.date);

            return (
              <button
                {...props}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-sm hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>{props.day.date.getDate()}</span>

                <span
                  className={`absolute bottom-1 h-2 w-2 rounded-full ${
                    status === "available"
                      ? "bg-green-500"
                      : status === "almost"
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  }`}
                />
              </button>
            );
          },
        }}
      />

      <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border bg-stone-50 p-4 text-center text-xs">
        <div>
          <div className="mx-auto mb-1 h-3 w-3 rounded-full bg-green-500" />
          <div className="font-semibold">ว่าง</div>
          <div className="text-stone-500">จองได้</div>
        </div>

        <div>
          <div className="mx-auto mb-1 h-3 w-3 rounded-full bg-yellow-400" />
          <div className="font-semibold">เกือบเต็ม</div>
          <div className="text-stone-500">เหลือ 1 รอบ</div>
        </div>

        <div>
          <div className="mx-auto mb-1 h-3 w-3 rounded-full bg-red-500" />
          <div className="font-semibold">เต็ม</div>
          <div className="text-stone-500">จองไม่ได้</div>
        </div>
      </div>
    </div>
  );
}