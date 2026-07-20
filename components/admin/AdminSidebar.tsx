import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  Images,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  ADMIN_NAVIGATION,
  isAdminNavigationActive,
  type AdminNavigationIcon,
} from "@/lib/admin-navigation";
import { cn } from "@/lib/utils";

const NAVIGATION_ICONS: Record<AdminNavigationIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  portfolio: Images,
  payment: CreditCard,
  security: ShieldCheck,
  bookings: ListChecks,
};

type AdminSidebarProps = {
  pathname: string;
  hash: string;
  onNavigate?: (href: string) => void;
  logoutControl: ReactNode;
};

export function AdminSidebar({
  pathname,
  hash,
  onNavigate,
  logoutControl,
}: AdminSidebarProps) {
  return (
    <div className="flex min-h-full flex-col bg-[var(--admin-sidebar)] px-4 py-5 text-white">
      <Link
        href="/admin"
        onClick={() => onNavigate?.("/admin")}
        className="admin-focus flex min-h-16 items-center gap-3 rounded-xl px-2"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#9d7951] text-sm font-bold text-[#eadbc8]">
          N
        </span>
        <span className="leading-none">
          <span className="block text-sm font-extrabold tracking-[0.08em]">NIMMAN</span>
          <span className="mt-1 block text-sm font-extrabold tracking-[0.08em]">FOTO</span>
        </span>
      </Link>

      <div className="mt-3 px-2 text-xs font-medium text-white/45">ผู้ดูแลระบบ</div>

      <nav aria-label="เมนูผู้ดูแลระบบ" className="mt-7 space-y-1.5">
        {ADMIN_NAVIGATION.map((item) => {
          const Icon = NAVIGATION_ICONS[item.icon];
          const active = isAdminNavigationActive(pathname, item.href, hash);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate?.(item.href)}
              className={cn(
                "admin-focus flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#806342] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "text-white/70 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/8 bg-white/5 p-3.5">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#806342] text-sm font-bold">
            A
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Admin User</p>
            <p className="mt-0.5 text-xs text-white/45">ผู้ดูแลระบบ</p>
          </div>
        </div>
        {logoutControl}
      </div>
    </div>
  );
}
