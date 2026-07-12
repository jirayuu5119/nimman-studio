"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import Calendar from "@/components/Calendar";
import FloatingSocialLinks from "@/components/FloatingSocialLinks";
import HourSelector from "@/components/HourSelector";
import GraduateSelector from "@/components/GraduateSelector";
import {
  CalendarDays,
  SearchCheck,
  Sunrise,
  Sunset,
} from "lucide-react";
import { PACKAGES } from "@/lib/packages";
import { getTimeSlots } from "@/lib/timeSlots";

type BookedSlot = {
  booking_date: string;
  period: "morning" | "afternoon";
  status: string;
};

type SiteSettings = {
  instagramUrl: string;
  facebookUrl: string;
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
  const [availabilityError, setAvailabilityError] = useState("");
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    instagramUrl: "",
    facebookUrl: "",
  });

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch("/api/bookings/availability");
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data.error ?? "โหลดตารางคิวไม่สำเร็จ");
        }

        setBookedSlots(data);
        setAvailabilityError("");
      } catch {
        setBookedSlots([]);
        setAvailabilityError(
          "ยังโหลดตารางคิวไม่ได้ กรุณารีเฟรชหน้าอีกครั้ง"
        );
      }
    }

    fetchAvailability();
  }, []);

  useEffect(() => {
    async function fetchSiteSettings() {
      const res = await fetch("/api/site-settings");
      const data = await res.json();

      setSiteSettings({
        instagramUrl: data.instagramUrl ?? "",
        facebookUrl: data.facebookUrl ?? "",
      });
    }

    fetchSiteSettings();
    fetch("/api/page-views/booking", {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
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
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-stone-900 md:py-12">
      <FloatingSocialLinks
        instagramUrl={siteSettings.instagramUrl}
        facebookUrl={siteSettings.facebookUrl}
      />

      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
  GRADUATION PHOTOGRAPHY
</p>

<div className="mt-5 flex justify-center">
  <div className="w-[280px] md:w-[420px]">
    <Image
      src="/nimman-logo.png"
      alt="Nimman Foto"
      width={420}
      height={195}
      priority
      style={{ width: "100%", height: "auto" }}
      className="h-auto w-full"
    />
  </div>
</div>

<h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
  จองคิวถ่ายภาพ
</h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-500 md:text-base">
            วันซ้อม / วันจริง / นอกรอบ / รับทรานสคริป เลือกวันที่ รอบเวลา และแพ็กเกจที่ต้องการ
            <br className="hidden md:block" />
            ระบบจะแสดงวันว่างและรอบที่จองได้แบบอัตโนมัติ
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/booking/status"
              className="inline-flex items-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-stone-900"
            >
              <SearchCheck size={17} />
              ตรวจสอบสถานะการจอง
            </Link>

          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <section>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                    Step 01
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-900">
                    เลือกวันที่
                  </h2>
                </div>

                <CalendarDays className="text-stone-300" size={26} />
              </div>

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

              {availabilityError && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800"
                >
                  {availabilityError}
                </p>
              )}

              {!booking.date && (
                <p className="mt-4 text-center text-sm text-stone-400">
                  กรุณาเลือกวันที่ต้องการจอง
                </p>
              )}
            </section>

            <section className="rounded-[1.5rem] border border-stone-200/80 bg-stone-50/70 p-5 md:p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                  Step 02
                </p>

                <h2 className="mt-2 text-xl font-semibold text-stone-900">
                  รายละเอียดการจอง
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-500">
                  เลือกรอบเวลา ชั่วโมงถ่าย และจำนวนบัณฑิต
                </p>
              </div>

              {booking.date && (
                <div className="mt-6 rounded-2xl border border-stone-200 bg-white px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-stone-500">วันที่เลือก</span>
                    <span className="font-semibold text-stone-900">
                      {booking.date.toLocaleDateString("th-TH")}
                    </span>
                  </div>
                </div>
              )}

              {booking.date && (
                <>
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold text-stone-900">
                      เลือกรอบเวลา
                    </h3>

                    {!booking.period && (
                      <p className="mt-2 text-xs text-stone-400">
                        กรุณาเลือกรอบเวลา
                      </p>
                    )}

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                        className={`rounded-2xl border px-5 py-6 text-left transition ${
                          isMorningBooked
                            ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-300"
                            : booking.period === "morning"
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-stone-200 bg-white text-stone-800 hover:border-stone-400"
                        }`}
                      >
                        <Sunrise size={28} />
                        <h4 className="mt-4 font-semibold">รอบเช้า</h4>
                        <p className="mt-1 text-sm opacity-70">
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
                        className={`rounded-2xl border px-5 py-6 text-left transition ${
                          isAfternoonBooked
                            ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-300"
                            : booking.period === "afternoon"
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-stone-200 bg-white text-stone-800 hover:border-stone-400"
                        }`}
                      >
                        <Sunset size={28} />
                        <h4 className="mt-4 font-semibold">รอบบ่าย</h4>
                        <p className="mt-1 text-sm opacity-70">
                          {isAfternoonBooked ? "ถูกจองแล้ว" : "13:00 - 18:00"}
                        </p>
                      </button>
                    </div>
                  </div>

                  {booking.period && (
                    <>
                      <div className="mt-8 border-t border-stone-200 pt-8">
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
                      </div>

                      <div className="mt-8">
                        <h3 className="text-sm font-semibold text-stone-900">
                          เลือกช่วงเวลาถ่าย
                        </h3>

                        {!booking.startTime && (
                          <p className="mt-2 text-xs text-stone-400">
                            กรุณาเลือกช่วงเวลาถ่าย
                          </p>
                        )}

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
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
                                className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                                  active
                                    ? "border-stone-900 bg-stone-900 text-white"
                                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                                }`}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-8 border-t border-stone-200 pt-8">
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
                      </div>

                      {packageInfo && (
                        <div className="mt-8 rounded-[1.5rem] border border-stone-200 bg-white p-5">
                          <h3 className="text-lg font-semibold text-stone-900">
                            สรุปรายการจอง
                          </h3>

                          <div className="mt-5 space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500">วันที่</span>
                              <span className="font-medium text-stone-900">
                                {booking.date.toLocaleDateString("th-TH")}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500">รอบเวลา</span>
                              <span className="font-medium text-stone-900">
                                {booking.period === "morning"
                                  ? "รอบเช้า"
                                  : "รอบบ่าย"}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500">
                                ช่วงเวลาถ่าย
                              </span>
                              <span className="font-medium text-stone-900">
                                {booking.startTime && booking.endTime
                                  ? `${booking.startTime} - ${booking.endTime}`
                                  : "-"}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500">
                                จำนวนชั่วโมง
                              </span>
                              <span className="font-medium text-stone-900">
                                {packageInfo.title}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500">
                                จำนวนบัณฑิต
                              </span>
                              <span className="font-medium text-stone-900">
                                {booking.graduates} คน
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500">
                                ราคาพื้นฐาน
                              </span>
                              <span className="font-medium text-stone-900">
                                {packageInfo.basePrice.toLocaleString()} บาท
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500">
                                เพิ่มบัณฑิต
                              </span>
                              <span className="font-medium text-stone-900">
                                {extraPrice.toLocaleString()} บาท
                              </span>
                            </div>

                            <div className="my-5 h-px bg-stone-200" />

                            <div className="flex items-end justify-between gap-4">
                              <span className="text-sm font-medium text-stone-500">
                                รวมทั้งหมด
                              </span>
                              <span className="font-serif text-3xl font-semibold text-stone-900">
                                {totalPrice.toLocaleString()} บาท
                              </span>
                            </div>
                          </div>

                          <button
                            disabled={!canNext}
                            onClick={() => router.push("/booking/info")}
                            className={`mt-6 w-full rounded-full px-6 py-4 text-sm font-semibold tracking-[0.18em] transition ${
                              canNext
                                ? "border border-stone-900 bg-stone-900 text-white hover:bg-white hover:text-stone-900"
                                : "cursor-not-allowed bg-stone-200 text-stone-400"
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
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
