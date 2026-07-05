"use client";

type Props = {
  value: number;
  onChange: (value: number) => void;
  extraPrice: number;
};

export default function GraduateSelector({
  value,
  onChange,
  extraPrice,
}: Props) {
  return (
    <div className="mt-10">
      <h2 className="mb-6 text-center text-2xl font-bold">
        จำนวนบัณฑิต
      </h2>

      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((item) => {
          const extra = (item - 1) * extraPrice;

          return (
            <button
              key={item}
              onClick={() => onChange(item)}
              className={`rounded-2xl border p-5 transition ${
                value === item
                  ? "bg-amber-700 text-white"
                  : "bg-white hover:bg-stone-50"
              }`}
            >
              <div className="text-3xl">🎓</div>

              <div className="mt-2 text-xl font-bold">
                {item} คน
              </div>

              <div
                className={`mt-2 text-sm ${
                  value === item
                    ? "text-amber-100"
                    : "text-amber-700"
                }`}
              >
                {item === 1
                  ? "+0 บาท"
                  : `+${extra.toLocaleString()} บาท`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}