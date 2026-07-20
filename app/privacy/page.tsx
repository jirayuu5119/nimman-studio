import type { Metadata } from "next";
import Link from "next/link";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "ประกาศความเป็นส่วนตัว",
  description: "รายละเอียดการเก็บ ใช้ และดูแลข้อมูลส่วนบุคคลของระบบจอง Nimman Foto",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f8f5f0] px-5 py-10 text-stone-900 md:py-16">
      <article className="mx-auto max-w-3xl rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_80px_rgba(0,0,0,0.06)] md:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-stone-400">
          Privacy Notice · Version {PRIVACY_NOTICE_VERSION}
        </p>
        <h1 className="mt-4 font-serif text-4xl font-semibold">
          ประกาศความเป็นส่วนตัว
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          Nimman Foto เคารพความเป็นส่วนตัวของผู้จอง เอกสารนี้อธิบายข้อมูลที่ระบบเก็บ
          วัตถุประสงค์ ผู้ให้บริการที่เกี่ยวข้อง ระยะเวลาจัดเก็บ และช่องทางติดต่อ
        </p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-stone-600">
          <section>
            <h2 className="text-lg font-semibold text-stone-900">ข้อมูลที่เก็บ</h2>
            <p className="mt-2">
              ชื่อ เบอร์โทร ช่องทางติดต่อ มหาวิทยาลัย คณะ รายละเอียดงาน วันที่และเวลา
              สถานะการจอง ข้อมูลราคา และรูปหลักฐานการชำระเงิน รวมถึงข้อมูลความปลอดภัย
              ที่แปลงเป็นค่าแฮช เช่น ตัวระบุผู้เข้าชมและตัวระบุสำหรับจำกัดคำขอ
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">วัตถุประสงค์</h2>
            <p className="mt-2">
              เพื่อรับและบริหารการจอง ตรวจสอบการชำระเงิน ติดต่อผู้จอง ป้องกันการจองซ้ำ
              รักษาความปลอดภัย แก้ไขปัญหา และจัดทำสถิติการให้บริการที่จำเป็น
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">ผู้ให้บริการที่เกี่ยวข้อง</h2>
            <p className="mt-2">
              ระบบใช้ Vercel สำหรับให้บริการเว็บไซต์, Supabase สำหรับฐานข้อมูล การยืนยันตัวตน
              และพื้นที่จัดเก็บแบบส่วนตัว และ Discord สำหรับแจ้งเตือนรายการจองแก่ผู้ดูแล
              โดยจำกัดข้อมูลและสิทธิ์เท่าที่จำเป็นต่อการให้บริการ
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">ระยะเวลาจัดเก็บ</h2>
            <p className="mt-2">
              สำหรับการจองที่เสร็จสิ้นหรือยกเลิก ระบบจะเก็บข้อมูลส่วนบุคคลและรูปสลิปไว้ไม่เกิน 365 วัน
              จากนั้นจะลบรูปสลิปและทำข้อมูลระบุตัวบุคคลให้ไม่สามารถเชื่อมโยงกลับได้
              โดยคงเฉพาะข้อมูลสรุปที่จำเป็นต่อรายงานทางธุรกิจ สำเนาสำรองที่เข้ารหัสอาจคงอยู่ต่ออีกช่วงสั้น ๆ
              ตามรอบการสำรองและจะถูกลบเมื่อครบกำหนดของรอบนั้น
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">สิทธิและช่องทางติดต่อ</h2>
            <p className="mt-2">
              หากต้องการสอบถาม ขอเข้าถึง แก้ไข หรือลบข้อมูล กรุณาติดต่อ Nimman Foto ผ่าน{" "}
              <a
                href="https://line.me/ti/p/tEgkF7b0Vg"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-stone-900 underline underline-offset-4"
              >
                LINE ส่วนตัว
              </a>
              {" "}พร้อมแจ้งเลขที่การจองและข้อมูลสำหรับยืนยันตัวตน
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">การปรับปรุงประกาศ</h2>
            <p className="mt-2">
              หากมีการเปลี่ยนวัตถุประสงค์หรือวิธีดูแลข้อมูลอย่างมีนัยสำคัญ
              ระบบจะเผยแพร่ประกาศฉบับใหม่พร้อมวันที่มีผลบังคับใช้
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-10 inline-flex rounded-full border border-stone-900 bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-stone-900"
        >
          กลับหน้าแรก
        </Link>
      </article>
    </main>
  );
}
