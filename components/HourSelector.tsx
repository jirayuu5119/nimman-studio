"use client";

type Props = {
  value: number;
  onChange: (hour: number) => void;
};

export default function HourSelector({ value, onChange }: Props) {
  const packages = [
    {
      hour: 3,
      price: 4000,
      label: "Half Day",
      description: "เหมาะสำหรับถ่ายช่วงสั้น กระชับ",
    },
    {
      hour: 4,
      price: 4500,
      label: "Half Day Plus",
      description: "มีเวลาถ่ายหลากหลายมุมมากขึ้น",
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
          Package
        </p>

        <h3 className="mt-2 text-sm font-semibold text-stone-900">
          เลือกจำนวนชั่วโมง
        </h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {packages.map((item) => {
          const active = value === item.hour;

          return (
            <button
              key={item.hour}
              onClick={() => onChange(item.hour)}
              className={`rounded-2xl border p-5 text-left transition ${
                active
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-800 hover:border-stone-400"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-xs uppercase tracking-[0.2em] ${
                      active ? "text-stone-300" : "text-stone-400"
                    }`}
                  >
                    {item.label}
                  </p>

                  <h4 className="mt-3 text-2xl font-semibold">
                    {item.hour} ชั่วโมง
                  </h4>
                </div>

                <div
                  className={`h-4 w-4 rounded-full border ${
                    active
                      ? "border-white bg-white"
                      : "border-stone-300 bg-white"
                  }`}
                />
              </div>

              <p
                className={`mt-4 text-sm leading-6 ${
                  active ? "text-stone-300" : "text-stone-500"
                }`}
              >
                {item.description}
              </p>

              <div
                className={`mt-5 text-lg font-semibold ${
                  active ? "text-white" : "text-stone-900"
                }`}
              >
                {item.price.toLocaleString()} บาท
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}