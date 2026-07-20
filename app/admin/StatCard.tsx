import { ReactNode } from "react";
import type { AdminTone } from "@/lib/admin-dashboard";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string | number;
  icon: ReactNode;
  tone: AdminTone;
  detail: string;
};

const TONE_STYLES: Record<AdminTone, string> = {
  neutral: "bg-stone-100 text-stone-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-700",
};

export default function StatCard({
  title,
  value,
  icon,
  tone,
  detail,
}: Props) {
  return (
    <article className="admin-panel min-h-28 p-3.5 sm:p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            TONE_STYLES[tone]
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium leading-5 text-[var(--admin-muted)]">
            {title}
          </p>
          <p className="mt-0.5 break-words text-xl font-bold tracking-tight text-[var(--admin-text)] sm:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-[var(--admin-muted)]">{detail}</p>
        </div>
      </div>
    </article>
  );
}
