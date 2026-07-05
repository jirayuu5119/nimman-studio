import { ReactNode } from "react";

type Props = {
  left: ReactNode;
  right: ReactNode;
};

export default function DashboardLayout({
  left,
  right,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {left}
      </div>

      <div className="space-y-6">
        {right}
      </div>
    </div>
  );
}