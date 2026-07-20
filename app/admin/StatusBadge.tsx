import { getAdminStatusPresentation, type AdminTone } from "@/lib/admin-dashboard";

type Props = { status: string };

const TONE_CLASSES: Record<AdminTone, string> = {
  neutral: "bg-stone-50 text-stone-600 ring-stone-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
};

export default function StatusBadge({ status }: Props) {
  const item = getAdminStatusPresentation(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONE_CLASSES[item.tone]}`}
    >
      {item.label}
    </span>
  );
}
