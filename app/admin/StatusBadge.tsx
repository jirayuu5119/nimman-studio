type Props = {
  status: string;
};

const statusMap: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  pending: {
    label: "รอตรวจสอบ",
    className:
      "bg-amber-50 text-amber-700 ring-amber-200",
  },
  confirmed: {
    label: "ยืนยันแล้ว",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  cancelled: {
    label: "ยกเลิก",
    className:
      "bg-red-50 text-red-700 ring-red-200",
  },
  completed: {
    label: "เสร็จสิ้น",
    className:
      "bg-blue-50 text-blue-700 ring-blue-200",
  },
  paid: {
    label: "ชำระแล้ว",
    className:
      "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  draft: {
    label: "แบบร่าง",
    className:
      "bg-neutral-50 text-neutral-500 ring-neutral-200",
  },
};

export default function StatusBadge({ status }: Props) {
  const item = statusMap[status] ?? {
    label: status,
    className:
      "bg-neutral-50 text-neutral-600 ring-neutral-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${item.className}`}
    >
      {item.label}
    </span>
  );
}