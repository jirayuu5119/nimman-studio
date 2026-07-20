import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function AdminHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-[var(--admin-accent)]">Nimman Foto · ผู้ดูแลระบบ</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--admin-text)] sm:text-[1.75rem]">
          แดชบอร์ดผู้ดูแล
        </h1>
        <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
          จัดการรายการจอง ตรวจสอบยอด และติดตามสถานะการทำงาน
        </p>
      </div>
      <Link
        href="/booking"
        target="_blank"
        rel="noreferrer"
        className="admin-focus inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] bg-white px-4 text-sm font-semibold text-[var(--admin-text)] transition-colors hover:border-[var(--admin-accent)]"
      >
        <ExternalLink aria-hidden="true" size={17} />
        ดูหน้าเว็บจอง
      </Link>
    </header>
  );
}
