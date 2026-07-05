import { updateBookingStatus } from "@/app/admin/actions";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export default async function BookingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (!booking) {
    notFound();
  }

  async function approve() {
    "use server";

    await updateBookingStatus(id, "confirmed");
  }

  async function reject() {
    "use server";

    await updateBookingStatus(id, "cancelled");
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">
        {booking.booking_no}
      </h1>

      <div className="space-y-3 rounded-xl border p-6">
        <p>
          <b>ชื่อ</b> : {booking.fullname || "-"}
        </p>

        <p>
          <b>โทร</b> : {booking.phone || "-"}
        </p>

        <p>
          <b>วันที่</b> : {booking.booking_date}
        </p>

        <p>
          <b>ช่วงเวลา</b> : {booking.period}
        </p>

        <p>
          <b>ชั่วโมง</b> : {booking.hours}
        </p>

        <p>
          <b>จำนวนบัณฑิต</b> : {booking.graduates}
        </p>

        <p>
          <b>มหาวิทยาลัย</b> : {booking.university || "-"}
        </p>

        <p>
          <b>คณะ</b> : {booking.faculty || "-"}
        </p>

        <p>
          <b>สถานะ</b> : {booking.status}
        </p>

        <p>
          <b>ยอดเงิน</b> : {booking.total_price} บาท
        </p>

        <img
          src={booking.slip_url}
          alt="Slip"
          className="mt-6 w-full rounded-xl border"
        />

        <div className="mt-8 flex gap-4">
          <form action={approve}>
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700"
            >
              อนุมัติ
            </button>
          </form>

          <form action={reject}>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-6 py-3 text-white hover:bg-red-700"
            >
              ปฏิเสธ
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}