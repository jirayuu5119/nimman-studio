"use client";
import type { BookingData } from "@/types/booking";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import { UNIVERSITIES } from "@/lib/universities";

export default function BookingInfoPage() {
  const router = useRouter();

  const { booking, setBooking } = useBooking();

  const selectedUniversity = UNIVERSITIES.find(
    (u) => u.name === booking.university
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
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

  return (
    <main className="min-h-screen bg-stone-100 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-10 shadow-2xl">
          {/* Header */}

          <div className="text-center">
            <h1 className="text-4xl font-black text-stone-800">
              ข้อมูลผู้จอง
            </h1>

            <p className="mt-2 text-stone-500">
              ขั้นตอนที่ 2 จาก 5
            </p>
          </div>

          {/* Form */}

          <div className="mt-10 grid gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block font-semibold">
                ชื่อ - นามสกุล *
              </label>

              <input
                name="fullname"
                value={booking.fullname}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                เบอร์โทร *
              </label>

              <input
                name="phone"
                value={booking.phone}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Line ID
              </label>

              <input
                name="line"
                value={booking.line}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Facebook
              </label>

              <input
                name="facebook"
                value={booking.facebook}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                มหาวิทยาลัย *
              </label>

              <select
                name="university"
                value={booking.university}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              >
                <option value="">
                  เลือกมหาวิทยาลัย
                </option>

                {UNIVERSITIES.map((university) => (
                  <option
                    key={university.name}
                    value={university.name}
                  >
                    {university.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                คณะ *
              </label>

              <select
                name="faculty"
                value={booking.faculty}
                onChange={handleChange}
                disabled={!selectedUniversity}
                className="w-full rounded-xl border p-3 disabled:bg-stone-100"
              >
                <option value="">
                  เลือกคณะ
                </option>

                {selectedUniversity?.faculties.map((faculty) => (
                  <option
                    key={faculty}
                    value={faculty}
                  >
                    {faculty}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="mt-6">
            <label className="mb-2 block font-semibold">
              รายละเอียดเพิ่มเติม
            </label>

            <textarea
              rows={5}
              name="note"
              value={booking.note}
              onChange={handleChange}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div className="mt-10 flex gap-4">

            <button
              onClick={() => router.back()}
              className="flex-1 rounded-xl border py-4 text-lg font-bold"
            >
              ← ย้อนกลับ
            </button>

            <button
              onClick={() => router.push("/booking/summary")}
              className="flex-1 rounded-xl bg-amber-700 py-4 text-lg font-bold text-white transition hover:bg-amber-800"
            >
              ถัดไป →
            </button>

          </div>

        </div>
      </div>
    </main>
  );
}