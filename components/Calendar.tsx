"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Props = {
  selected: Date | null;
  onSelect: (date: Date | null) => void;
};

export default function Calendar({
  selected,
  onSelect,
}: Props) {
  return (
    <div className="rounded-xl border p-4">
      <DayPicker
        mode="single"
        selected={selected ?? undefined}
        onSelect={(date) => onSelect(date ?? null)}
      />
    </div>
  );
}