import Link from "next/link";
import {
  CalendarDays,
  Download,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

const actionClassName =
  "admin-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] bg-white px-3.5 text-sm font-medium text-[var(--admin-text)] transition-colors hover:border-[var(--admin-accent)] hover:bg-[var(--admin-surface-muted)]";

export function AdminQuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading" className="admin-panel p-3 sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <h2 id="quick-actions-heading" className="shrink-0 text-sm font-bold">
          เครื่องมือด่วน
        </h2>
        <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-4">
          <Link href="/booking" target="_blank" rel="noreferrer" className={actionClassName}>
            <ExternalLink aria-hidden="true" size={16} />
            เปิดเว็บจอง
          </Link>
          <Link href="/admin" className={actionClassName}>
            <RefreshCw aria-hidden="true" size={16} />
            Refresh ข้อมูล
          </Link>
          <Link href="/admin/calendar" className={actionClassName}>
            <CalendarDays aria-hidden="true" size={16} />
            ปฏิทินคิว
          </Link>
          <a href="/api/admin/bookings/export" className={actionClassName}>
            <Download aria-hidden="true" size={16} />
            Export CSV
          </a>
        </div>
      </div>
    </section>
  );
}
