"use client";

import type { ChangeEvent } from "react";
import type { BookingData } from "@/types/booking";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import { isValidThaiPhone } from "@/lib/phone";
import { UNIVERSITIES } from "@/lib/universities";

export default function BookingInfoPage() {
  const router = useRouter();
  const { booking, setBooking } = useBooking();

  const selectedUniversity = UNIVERSITIES.find(
    (u) => u.name === booking.university
  );
  const defaultFaculties = UNIVERSITIES[0]?.faculties ?? [];
  const facultyOptions = selectedUniversity
    ? selectedUniversity.faculties
    : booking.faculty.trim()
    ? [
        booking.faculty,
        ...defaultFaculties.filter(
          (faculty) => faculty !== booking.faculty
        ),
      ]
    : defaultFaculties;
  const phoneIsValid = isValidThaiPhone(booking.phone);
  const canNext =
    booking.fullname.trim() !== "" &&
    phoneIsValid &&
    booking.line.trim() !== "" &&
    booking.university.trim() !== "" &&
    booking.faculty.trim() !== "";

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "university") {
      setBooking((prev: BookingData) => ({
        ...prev,
        university: value,
        faculty: "",
      }));
      return;
    }

    setBooking((prev: BookingData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const inputClass =
    "w-full rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-300 focus:border-stone-900";

  const labelClass = "mb-2 block text-sm font-medium text-stone-700";

  return (
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-stone-900 md:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
            Step 02
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
            ข้อมูลผู้จอง
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-500 md:text-base">
            กรอกข้อมูลสำหรับติดต่อกลับและยืนยันรายละเอียดการจอง
          </p>
        </div>

        <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:p-10">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>ชื่อ - นามสกุล *</label>
              <input
                name="fullname"
                value={booking.fullname}
                onChange={handleChange}
                placeholder="กรอกชื่อ-นามสกุล"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>เบอร์โทร *</label>
              <input
                name="phone"
                value={booking.phone}
                onChange={handleChange}
                placeholder="กรอกเบอร์โทร 10 หลัก"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={booking.phone.trim() !== "" && !phoneIsValid}
                className={inputClass}
              />
              {booking.phone.trim() !== "" && !phoneIsValid && (
                <p className="mt-2 text-xs leading-5 text-rose-600">
                  กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Line ID *</label>
              <input
                name="line"
                value={booking.line}
                onChange={handleChange}
                placeholder="เช่น winatee7927"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Facebook</label>
              <input
                name="facebook"
                value={booking.facebook}
                onChange={handleChange}
                placeholder="ชื่อ Facebook หรือ Link"
                className={inputClass}
              />
            </div>

            <div className="min-w-0">
              <label className={labelClass}>มหาวิทยาลัย *</label>
              <select
                name="university"
                value={booking.university}
                onChange={handleChange}
                className={`${inputClass} min-w-0 truncate`}
              >
                <option value="">เลือกมหาวิทยาลัย / วิทยาลัยพยาบาล</option>
                {UNIVERSITIES.map((university) => (
                  <option key={university.name} value={university.name}>
                    {university.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className={labelClass}>คณะ *</label>
              <select
                name="faculty"
                value={booking.faculty}
                onChange={handleChange}
                disabled={!booking.university.trim()}
                className={`${inputClass} min-w-0 truncate disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400`}
              >
                <option value="">เลือกคณะ</option>

                {facultyOptions.map((faculty) => (
                  <option key={faculty} value={faculty}>
                    {faculty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className={labelClass}>รายละเอียดเพิ่มเติม</label>

            <textarea
              rows={5}
              name="note"
              value={booking.note}
              onChange={handleChange}
              placeholder="เช่น สถานที่ที่อยากถ่าย โทนภาพที่ชอบ หรือรายละเอียดอื่น ๆ"
              className={`${inputClass} resize-none leading-6`}
            />
          </div>

          <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50/80 px-5 py-4">
            <p className="text-sm leading-6 text-stone-500">
              * กรุณากรอกข้อมูลที่มีเครื่องหมายดอกจันให้ครบ โดยเฉพาะเบอร์โทรและ Line ID
              เพื่อใช้สำหรับติดต่อยืนยันการจอง
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-stone-300 bg-white px-6 py-4 text-sm font-semibold tracking-[0.12em] text-stone-700 transition hover:border-stone-900"
            >
              ← ย้อนกลับ
            </button>

            <button
              disabled={!canNext}
              onClick={() => router.push("/booking/summary")}
              className={`rounded-full px-6 py-4 text-sm font-semibold tracking-[0.12em] transition ${
                canNext
                  ? "border border-stone-900 bg-stone-900 text-white hover:bg-white hover:text-stone-900"
                  : "cursor-not-allowed bg-stone-200 text-stone-400"
              }`}
            >
              ถัดไป →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
