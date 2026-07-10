"use client";

import { useEffect, useRef, useState } from "react";
import BookingConfirmationCard from "@/components/BookingConfirmationCard";
import DownloadBookingConfirmationButton from "@/components/DownloadBookingConfirmationButton";
import type { BookingConfirmationData } from "@/types/booking";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

export default function BookingConfirmationSection({
  booking,
}: {
  booking: BookingConfirmationData;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateScale = () => {
      setScale(Math.min(frame.clientWidth / CARD_WIDTH, 0.5));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="mx-auto mt-8 max-w-[540px]">
      <div
        ref={frameRef}
        className="w-full overflow-hidden rounded-2xl border border-stone-200 bg-[#F6F1E8] shadow-[0_18px_60px_rgba(0,0,0,0.07)]"
        style={{ height: CARD_HEIGHT * scale }}
      >
        <div
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <BookingConfirmationCard ref={cardRef} booking={booking} />
        </div>
      </div>

      <DownloadBookingConfirmationButton
        bookingNo={booking.booking_no}
        status={booking.status}
        cardRef={cardRef}
      />
    </section>
  );
}
