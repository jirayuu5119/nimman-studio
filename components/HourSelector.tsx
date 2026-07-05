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
    },
    {
      hour: 4,
      price: 4500,
    },
  ];

  return (
    <div className="mt-10">
      <h2 className="mb-6 text-center text-2xl font-bold">
        เลือกจำนวนชั่วโมง
      </h2>

      <div className="mx-auto grid max-w-2xl gap-6 md:grid-cols-2">
        {packages.map((item) => (
          <button
            key={item.hour}
            onClick={() => onChange(item.hour)}
            className={`rounded-2xl border p-8 transition ${
              value === item.hour
                ? "bg-amber-700 text-white"
                : "bg-white hover:bg-stone-50"
            }`}
          >
            <div className="mb-3 text-4xl">⏰</div>

            <div className="text-2xl font-bold">
              {item.hour} ชั่วโมง
            </div>

            <div
              className={`mt-3 text-lg font-semibold ${
                value === item.hour
                  ? "text-amber-100"
                  : "text-amber-700"
              }`}
            >
              {item.price.toLocaleString()} บาท
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}