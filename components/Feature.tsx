const features = [
  {
    number: "01",
    title: "เลือกวันว่าง",
    description: "ตรวจสอบวันและรอบที่ยังจองได้",
  },
  {
    number: "02",
    title: "เลือกรอบเวลา",
    description: "รอบเช้า หรือ รอบบ่าย",
  },
  {
    number: "03",
    title: "เลือกแพ็กเกจ",
    description: "เลือกระยะเวลาและจำนวนบัณฑิต",
  },
  {
    number: "04",
    title: "ชำระมัดจำ",
    description: "อัปโหลดสลิปเพื่อยืนยันการจอง",
  },
];

export default function Feature() {
  return (
    <div className="space-y-3">
      {features.map((item) => (
        <div
          key={item.number}
          className="flex items-center gap-4 rounded-2xl border border-stone-200/70 bg-stone-50/70 px-5 py-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-xs font-semibold text-stone-500">
            {item.number}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-800">
              {item.title}
            </h3>

            <p className="mt-1 text-xs leading-5 text-stone-500">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}