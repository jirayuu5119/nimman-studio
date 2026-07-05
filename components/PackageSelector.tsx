"use client";

type Props = {
  hours: number;
  value: string;
  onChange: (value: string) => void;
};

export default function PackageSelector({
  hours,
  value,
  onChange,
}: Props) {
  const prices: Record<number, number> = {
    2: 3000,
    3: 4000,
    4: 4500,
    5: 5000,
  };

  const list = [
    {
      id: "normal",
      name: "แพ็กเกจปกติ",
      price: prices[hours],
      detail: "แต่งภาพครบทุกภาพ",
    },
    {
      id: "premium",
      name: "Premium",
      price: prices[hours] + 1000,
      detail: "แต่งพิเศษ + ส่งด่วน",
    },
  ];

  return (
    <div className="mt-12">
      <h2 className="text-center text-2xl font-bold mb-6">
        เลือกแพ็กเกจ
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {list.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => onChange(pkg.id)}
            className={`rounded-2xl border p-8 text-left transition ${
              value === pkg.id
                ? "bg-amber-700 text-white"
                : "bg-white hover:bg-stone-50"
            }`}
          >
            <div className="text-3xl mb-3">📷</div>

            <div className="text-2xl font-bold">
              {pkg.name}
            </div>

            <div className="mt-2 opacity-80">
              {pkg.detail}
            </div>

            <div className="mt-6 text-3xl font-black">
              {pkg.price.toLocaleString()} บาท
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}