import {
  DollarSign,
  Calendar,
  Clock3,
  CheckCircle2,
  XCircle,
  Users,
  BadgeCheck,
  CreditCard,
} from "lucide-react";

import StatCard from "./StatCard";

type Props = {
  analytics: {
    totalRevenue: number;
    totalBookings: number;
    today: number;
    thisMonth: number;
    pending: number;
    paid: number;
    confirmed: number;
    cancelled: number;
  };
};

export default function DashboardCards({
  analytics,
}: Props) {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">

      <StatCard
        title="Revenue"
        value={`฿${analytics.totalRevenue.toLocaleString()}`}
        icon={<DollarSign className="h-6 w-6 text-white" />}
        color="bg-emerald-500"
      />

      <StatCard
        title="Bookings"
        value={analytics.totalBookings}
        icon={<Users className="h-6 w-6 text-white" />}
        color="bg-slate-800"
      />

      <StatCard
        title="Today"
        value={analytics.today}
        icon={<Calendar className="h-6 w-6 text-white" />}
        color="bg-sky-500"
      />

      <StatCard
        title="This Month"
        value={analytics.thisMonth}
        icon={<Clock3 className="h-6 w-6 text-white" />}
        color="bg-indigo-500"
      />

      <StatCard
        title="Pending"
        value={analytics.pending}
        icon={<Clock3 className="h-6 w-6 text-white" />}
        color="bg-yellow-500"
      />

      <StatCard
        title="Paid"
        value={analytics.paid}
        icon={<CreditCard className="h-6 w-6 text-white" />}
        color="bg-blue-500"
      />

      <StatCard
        title="Confirmed"
        value={analytics.confirmed}
        icon={<BadgeCheck className="h-6 w-6 text-white" />}
        color="bg-green-500"
      />

      <StatCard
        title="Cancelled"
        value={analytics.cancelled}
        icon={<XCircle className="h-6 w-6 text-white" />}
        color="bg-red-500"
      />

    </div>
  );
}