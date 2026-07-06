"use client";

import { useRouter } from "next/navigation";

export default function BookingButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/booking")}
      className="
        group
        w-full
        rounded-full
        border
        border-stone-900
        bg-stone-900
        px-6
        py-4
        text-sm
        font-semibold
        tracking-[0.18em]
        text-white
        transition
        duration-300
        hover:bg-white
        hover:text-stone-900
      "
    >
      <span className="inline-flex items-center gap-3">
        เริ่มจองคิว
        <span className="transition duration-300 group-hover:translate-x-1">
          →
        </span>
      </span>
    </button>
  );
}