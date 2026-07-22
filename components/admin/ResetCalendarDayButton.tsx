"use client";

import { useActionState } from "react";
import { resetCalendarDay } from "@/app/admin/actions";
import {
  INITIAL_RESET_CALENDAR_DAY_STATE,
  getResetCalendarDayConfirmation,
} from "@/lib/admin-calendar";

export function ResetCalendarDayButton({
  dateKey,
  dateLabel,
}: {
  dateKey: string;
  dateLabel: string;
}) {
  const [state, action, pending] = useActionState(
    resetCalendarDay,
    INITIAL_RESET_CALENDAR_DAY_STATE
  );

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(getResetCalendarDayConfirmation(dateLabel))) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="bookingDate" value={dateKey} />
      <button
        type="submit"
        disabled={pending}
        className="admin-focus min-h-9 w-full rounded-lg border border-emerald-300 bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800 transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {pending ? "กำลังเปิดคิว..." : "เปิดคิวทั้งวัน"}
      </button>
      <p
        aria-live="polite"
        className={`mt-1 min-h-4 text-[11px] ${
          state.status === "error" ? "text-red-700" : "text-emerald-700"
        }`}
      >
        {state.message}
      </p>
    </form>
  );
}
