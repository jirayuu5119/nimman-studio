"use client";

type Props = {
  value: number;
  onChange: (value: number) => void;
  extraPrice: number;
};

const graduates = [1, 2, 3, 4, 5];

export default function GraduateSelector({
  value,
  onChange,
  extraPrice,
}: Props) {
  const extraGraduateCount = Math.max(value - 1, 0);
  const extraTotal = extraGraduateCount * extraPrice;

  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
          Graduates
        </p>

        <h3 className="mt-2 text-sm font-semibold text-stone-900">
          จำนวนบัณฑิต
        </h3>

        <p className="mt-2 text-sm leading-6 text-stone-500">
          บัณฑิตคนแรกอยู่ในแพ็กเกจแล้ว คนถัดไปเพิ่ม{" "}
          {extraPrice.toLocaleString()} บาท / คน
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4 md:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {graduates.map((item) => {
            const active = value === item;
            const extra = (item - 1) * extraPrice;

            return (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                className={`rounded-2xl border px-4 py-5 text-left transition ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-400"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                      active
                        ? "border-white bg-white text-stone-900"
                        : "border-stone-300 bg-white text-stone-600"
                    }`}
                  >
                    {item}
                  </div>

                  <div
                    className={`h-3 w-3 rounded-full border ${
                      active
                        ? "border-white bg-white"
                        : "border-stone-300 bg-white"
                    }`}
                  />
                </div>

                <div className="mt-5 text-lg font-semibold">
                  {item} คน
                </div>

                <div
                  className={`mt-2 text-xs ${
                    active ? "text-stone-300" : "text-stone-500"
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

        <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-stone-500">บัณฑิตเพิ่ม</span>
            <span className="font-medium text-stone-900">
              {extraGraduateCount} คน
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-4 text-sm">
            <span className="text-stone-500">ค่าใช้จ่ายเพิ่มเติม</span>
            <span className="font-semibold text-stone-900">
              {extraTotal.toLocaleString()} บาท
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}