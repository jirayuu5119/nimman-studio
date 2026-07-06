"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import Calendar from "@/components/Calendar";
import HourSelector from "@/components/HourSelector";
import GraduateSelector from "@/components/GraduateSelector";
import { CalendarDays, Sunrise, Sunset } from "lucide-react";
import { PACKAGES } from "@/lib/packages";
import { getTimeSlots } from "@/lib/timeSlots";

type BookedSlot = {
  booking_date: string;
  period: "morning" | "afternoon";
  status: string;
};

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function BookingPage() {
  const router = useRouter();
  const { booking, setBooking } = useBooking();

  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);

  useEffect(() => {
    async function fetchAvailability() {
      const res = await fetch("/api/bookings/availability");
      const data = await res.json();
      setBookedSlots(data);
    }

    fetchAvailability();
  }, []);

  const packageInfo = PACKAGES[booking.hours];

  const extraPrice = packageInfo
    ? (booking.graduates - 1) * packageInfo.extraGraduatePrice
    : 0;

  const totalPrice = packageInfo
    ? packageInfo.basePrice + extraPrice
    : 0;

  const selectedDateKey = booking.date ? formatDateLocal(booking.date) : null;

  const isMorningBooked = bookedSlots.some(
    (slot) =>
      slot.booking_date === selectedDateKey && slot.period === "morning"
  );

  const isAfternoonBooked = bookedSlots.some(
    (slot) =>
      slot.booking_date === selectedDateKey && slot.period === "afternoon"
  );

  const timeSlots = getTimeSlots(booking.period, booking.hours);

  const canNext =
    booking.date !== null &&
    booking.period !== null &&
    booking.startTime !== null &&
    booking.endTime !== null;

  return (
    <main className="min-h-screen bg-stone-100 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-10 shadow-2xl">
          <div className="text-center">
            <h1 className="text-4xl font-black text-stone-800">
              จองคิวถ่ายภาพรับปริญญา
            </h1>

            <p className="mt-3 text-stone-500">
              ขั้นตอนที่ 1 เลือกวันที่ต้องการจอง
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <Calendar
              selected={booking.date}
              bookedSlots={bookedSlots}
              onSelect={(date) =>
                setBooking((prev) => ({
                  ...prev,
                  date,
                  period: null,
                  startTime: null,
                  endTime: null,
                }))
              }
            />
          </div>

          {!booking.date && (
            <p className="mt-4 text-center text-sm text-red-500">
              กรุณาเลือกวันที่ต้องการจอง
            </p>
          )}

          {booking.date && (
            <>
              <div className="mt-8 flex items-center justify-center gap-2">
                <CalendarDays size={22} />
                <span className="font-semibold">
                  {booking.date.toLocaleDateString("th-TH")}
                </span>
              </div>

              <h2 className="mt-10 text-center text-2xl font-bold">
                เลือกรอบเวลา
              </h2>

              {!booking.period && (
                <p className="mt-2 text-center text-sm text-red-500">
                  กรุณาเลือกรอบเวลา
                </p>
              )}

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <button
                  disabled={isMorningBooked}
                  onClick={() =>
                    setBooking((prev) => ({
                      ...prev,
                      period: "morning",
                      startTime: null,
                      endTime: null,
                    }))
                  }
                  className={`rounded-2xl border p-8 transition ${
                    isMorningBooked
                      ? "cursor-not-allowed bg-stone-200 text-stone-400"
                      : booking.period === "morning"
                      ? "bg-amber-700 text-white"
                      : "bg-white hover:bg-stone-50"
                  }`}
                >
                  <Sunrise className="mx-auto mb-4" size={42} />
                  <h3 className="text-xl font-bold">รอบเช้า</h3>
                  <p className="mt-2">
                    {isMorningBooked ? "ถูกจองแล้ว" : "07:00 - 12:00"}
                  </p>
                </button>

                <button
                  disabled={isAfternoonBooked}
                  onClick={() =>
                    setBooking((prev) => ({
                      ...prev,
                      period: "afternoon",
                      startTime: null,
                      endTime: null,
                    }))
                  }
                  className={`rounded-2xl border p-8 transition ${
                    isAfternoonBooked
                      ? "cursor-not-allowed bg-stone-200 text-stone-400"
                      : booking.period === "afternoon"
                      ? "bg-amber-700 text-white"
                      : "bg-white hover:bg-stone-50"
                  }`}
                >
                  <Sunset className="mx-auto mb-4" size={42} />
                  <h3 className="text-xl font-bold">รอบบ่าย</h3>
                  <p className="mt-2">
                    {isAfternoonBooked ? "ถูกจองแล้ว" : "13:00 - 18:00"}
                  </p>
                </button>
              </div>

              {booking.period && (
                <>
                  <HourSelector
                    value={booking.hours}
                    onChange={(value) =>
                      setBooking((prev) => ({
                        ...prev,
                        hours: value as 3 | 4,
                        startTime: null,
                        endTime: null,
                      }))
                    }
                  />

                  <div className="mt-10">
                    <h2 className="text-center text-2xl font-bold">
                      เลือกช่วงเวลาถ่าย
                    </h2>

                    {!booking.startTime && (
                      <p className="mt-2 text-center text-sm text-red-500">
                        กรุณาเลือกช่วงเวลาถ่าย
                      </p>
                    )}

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      {timeSlots.map((slot) => {
                        const active =
                          booking.startTime === slot.startTime &&
                          booking.endTime === slot.endTime;

                        return (
                          <button
                            key={`${slot.startTime}-${slot.endTime}`}
                            onClick={() =>
                              setBooking((prev) => ({
                                ...prev,
                                period: slot.period,
                                startTime: slot.startTime,
                                endTime: slot.endTime,
                              }))
                            }
                            className={`rounded-2xl border p-5 text-lg font-bold transition ${
                              active
                                ? "bg-amber-700 text-white"
                                : "bg-white hover:bg-stone-50"
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <GraduateSelector
                    value={booking.graduates}
                    onChange={(value) =>
                      setBooking((prev) => ({
                        ...prev,
                        graduates: value,
                      }))
                    }
                    extraPrice={packageInfo?.extraGraduatePrice ?? 0}
                  />

                  {packageInfo && (
                    <div className="mt-10 rounded-2xl border bg-stone-50 p-8">
                      <h2 className="mb-6 text-2xl font-bold">
                        📋 สรุปรายการจอง
                      </h2>

                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>📅 วันที่</span>
                          <span>{booking.date.toLocaleDateString("th-TH")}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>🌅 รอบเวลา</span>
                          <span>
                            {booking.period === "morning"
                              ? "รอบเช้า"
                              : "รอบบ่าย"}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>🕒 ช่วงเวลาถ่าย</span>
                          <span>
                            {booking.startTime && booking.endTime
                              ? `${booking.startTime} - ${booking.endTime}`
                              : "-"}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>⏰ จำนวนชั่วโมง</span>
                          <span>{packageInfo.title}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>🎓 จำนวนบัณฑิต</span>
                          <span>{booking.graduates} คน</span>
                        </div>

                        <div className="flex justify-between">
                          <span>💰 ราคาพื้นฐาน</span>
                          <span>
                            {packageInfo.basePrice.toLocaleString()} บาท
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>➕ เพิ่มบัณฑิต</span>
                          <span>{extraPrice.toLocaleString()} บาท</span>
                        </div>

                        <hr />

                        <div className="flex justify-between text-3xl font-bold text-amber-700">
                          <span>รวมทั้งหมด</span>
                          <span>{totalPrice.toLocaleString()} บาท</span>
                        </div>
                      </div>

                      <button
                        disabled={!canNext}
                        onClick={() => router.push("/booking/info")}
                        className={`mt-8 w-full rounded-xl py-4 text-xl font-bold text-white transition ${
                          canNext
                            ? "bg-amber-700 hover:bg-amber-800"
                            : "cursor-not-allowed bg-stone-300"
                        }`}
                      >
                        ถัดไป →
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}