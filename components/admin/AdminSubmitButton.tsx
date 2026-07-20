"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type AdminSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  icon?: ReactNode;
  className?: string;
};

export function AdminSubmitButton({
  idleLabel,
  pendingLabel,
  icon,
  className = "",
}: AdminSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`admin-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--admin-sidebar)] px-4 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
    >
      {icon}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
