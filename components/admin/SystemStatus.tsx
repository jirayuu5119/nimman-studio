type Props = {
  analytics: {
    totalBookings: number;
    pending: number;
    confirmed: number;
    cancelled: number;
  };
};

export default function SystemStatus({
  analytics,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold">
        System Status
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">
          <span>Total Bookings</span>
          <strong>{analytics.totalBookings}</strong>
        </div>

        <div className="flex justify-between">
          <span>Pending</span>
          <strong className="text-yellow-500">
            {analytics.pending}
          </strong>
        </div>

        <div className="flex justify-between">
          <span>Confirmed</span>
          <strong className="text-green-600">
            {analytics.confirmed}
          </strong>
        </div>

        <div className="flex justify-between">
          <span>Cancelled</span>
          <strong className="text-red-600">
            {analytics.cancelled}
          </strong>
        </div>

      </div>
    </div>
  );
}