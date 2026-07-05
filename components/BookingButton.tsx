"use client";

import { useRouter } from "next/navigation";

export default function BookingButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/booking")}
      className="
        w-full
        rounded-xl
        bg-amber-700
        hover:bg-amber-800
        text-white
        py-4
        text-lg
        font-semibold
        transition
      "
    >
      เริ่มจองเลย
    </button>
  );
}