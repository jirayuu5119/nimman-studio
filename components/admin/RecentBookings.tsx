import Link from "next/link";
import { Booking } from "@/types/booking";

type Props = {
  bookings: Booking[];
};

export default function RecentBookings({
  bookings,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b p-5">
        <h2 className="text-lg font-semibold">
          Recent Bookings
        </h2>
      </div>

      <div className="divide-y">
        {bookings.slice(0, 5).map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between p-5"
          >
            <div>
              <p className="font-semibold">
                {b.fullname}
              </p>

              <p className="text-sm text-gray-500">
                {b.booking_no}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {b.status}
              </span>

              <Link
                href={`/admin/bookings/${b.id}`}
                className="rounded-lg bg-black px-3 py-2 text-xs text-white"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}