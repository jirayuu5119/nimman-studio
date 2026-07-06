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

function parseDateLocal(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function Calendar({
  selected,
  bookedSlots,
  onSelect,
}: Props) {
  function getStatus(date: Date) {
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

  const dayStatus = bookedSlots.reduce((acc, slot) => {
    if (!acc[slot.booking_date]) {
      acc[slot.booking_date] = {
        morning: false,
        afternoon: false,
      };
    }

    acc[slot.booking_date][slot.period] = true;
    return acc;
  }, {} as Record<string, { morning: boolean; afternoon: boolean }>);

  const fullDays = Object.entries(dayStatus)
    .filter(([, value]) => value.morning && value.afternoon)
    .map(([date]) => parseDateLocal(date));

  return (
    <div className="w-full rounded-[1.5rem] border border-stone-200/80 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.04)] md:p-5">
      <DayPicker
        mode="single"
        selected={selected ?? undefined}
        onSelect={(date) => onSelect(date ?? null)}
        disabled={fullDays}
        showOutsideDays
        modifiers={{
          available: (date) => getStatus(date) === "available",
          almost: (date) => getStatus(date) === "almost",
          full: (date) => getStatus(date) === "full",
        }}
        modifiersClassNames={{
          available: "nf-day-available",
          almost: "nf-day-almost",
          full: "nf-day-full",
        }}
        classNames={{
          months: "flex justify-center",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label:
            "text-sm font-semibold tracking-wide text-stone-800",
          nav: "space-x-1 flex items-center",
          nav_button:
            "h-8 w-8 rounded-full border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "w-10 md:w-11 text-[11px] font-medium uppercase tracking-wide text-stone-400",
          row: "mt-2 flex w-full",
          cell: "relative h-10 w-10 md:h-11 md:w-11 p-0 text-center text-sm",
          day: "h-10 w-10 md:h-11 md:w-11 rounded-full text-sm font-medium text-stone-700 transition hover:bg-stone-100",
          day_selected:
            "bg-stone-900 text-white hover:bg-stone-900 focus:bg-stone-900",
          day_today: "font-bold text-stone-900",
          day_outside: "text-stone-300 opacity-40",
          day_disabled:
            "cursor-not-allowed text-stone-300 opacity-70 hover:bg-transparent",
        }}
      />

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3 text-center">
        <div className="rounded-xl bg-white px-2 py-3">
          <div className="mx-auto mb-2 h-2 w-2 rounded-full bg-emerald-400" />
          <div className="text-xs font-semibold text-stone-800">ว่าง</div>
          <div className="mt-1 text-[11px] text-stone-400">จองได้</div>
        </div>

        <div className="rounded-xl bg-white px-2 py-3">
          <div className="mx-auto mb-2 h-2 w-2 rounded-full bg-amber-300" />
          <div className="text-xs font-semibold text-stone-800">เกือบเต็ม</div>
          <div className="mt-1 text-[11px] text-stone-400">เหลือ 1 รอบ</div>
        </div>

        <div className="rounded-xl bg-white px-2 py-3">
          <div className="mx-auto mb-2 h-2 w-2 rounded-full bg-rose-400" />
          <div className="text-xs font-semibold text-stone-800">เต็ม</div>
          <div className="mt-1 text-[11px] text-stone-400">จองไม่ได้</div>
        </div>
      </div>

      <style jsx global>{`
        .nf-day-available {
          position: relative;
        }

        .nf-day-available::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 5px;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: #34d399;
          transform: translateX(-50%);
        }

        .nf-day-almost {
          position: relative;
        }

        .nf-day-almost::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 5px;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: #fbbf24;
          transform: translateX(-50%);
        }

        .nf-day-full {
          position: relative;
          color: #a8a29e !important;
          background: #f5f5f4 !important;
        }

        .nf-day-full::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 5px;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: #fb7185;
          transform: translateX(-50%);
        }

        .rdp {
          --rdp-accent-color: #1c1917;
          --rdp-background-color: #f5f5f4;
          margin: 0;
        }
      `}</style>
    </div>
  );
}