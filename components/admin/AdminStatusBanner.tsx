import { AlertTriangle, ShieldCheck } from "lucide-react";
import { getOperationalStatus } from "@/lib/admin-dashboard";
import { cn } from "@/lib/utils";

type AdminStatusBannerProps = {
  failedNotifications: number;
  retentionDays: number | null;
};

export function AdminStatusBanner({
  failedNotifications,
  retentionDays,
}: AdminStatusBannerProps) {
  const status = getOperationalStatus(failedNotifications);
  const warning = status.tone === "warning";
  const Icon = warning ? AlertTriangle : ShieldCheck;

  return (
    <section
      aria-labelledby="admin-system-status"
      className={cn(
        "rounded-[var(--admin-radius)] border px-4 py-3.5",
        warning
          ? "border-amber-200 bg-amber-50/80"
          : "border-emerald-200 bg-emerald-50/75"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
              warning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            )}
          >
            <Icon aria-hidden="true" size={18} />
          </span>
          <div className="min-w-0">
            <h2 id="admin-system-status" className="text-sm font-bold text-[var(--admin-text)]">
              {status.title}
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-[var(--admin-muted)] sm:text-sm">
              {status.description}
            </p>
          </div>
        </div>
        <span className="w-fit shrink-0 rounded-full border border-black/8 bg-white/75 px-3 py-1.5 text-xs font-medium text-[var(--admin-muted)]">
          Retention: {retentionDays ? `${retentionDays} วัน` : "ยังไม่เปิดใช้งาน"}
        </span>
      </div>
    </section>
  );
}
