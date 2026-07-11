import Image from "next/image";
import Link from "next/link";
import { SearchCheck } from "lucide-react";
import Feature from "@/components/Feature";
import BookingButton from "@/components/BookingButton";
import BookingQrDialog from "@/components/BookingQrDialog";

const bookingUrl = "https://grad.jirayufoto.net/";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f5f0] px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-xl rounded-[2rem] border border-stone-200/70 bg-white/90 px-8 py-10 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:px-12 md:py-14">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
              GRADUATION PHOTOGRAPHY
            </p>

            <div className="mt-5 flex justify-center">
              <Image
                src="/nimman-logo.png"
                alt="Nimman Foto"
                width={420}
                height={160}
                priority
                className="h-auto w-[280px] md:w-[380px]"
              />
            </div>

            <p className="mx-auto mt-6 max-w-sm text-sm leading-7 text-stone-500">
              ระบบจองคิวถ่ายภาพวันสำคัญ
              <br />
              รับปริญญา · รับทรานสคริป · จบพยาบาล
            </p>
          </div>

          <div className="my-10 h-px w-full bg-stone-200/70" />

          <Feature />

          <div className="mt-10 space-y-3">
            <BookingButton />

            <Link
              href="/booking/status"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-4 text-sm font-semibold tracking-[0.12em] text-stone-700 transition hover:border-stone-900 hover:bg-stone-50"
            >
              <SearchCheck size={18} />
              ตรวจสอบสถานะการจอง
            </Link>

            <BookingQrDialog bookingUrl={bookingUrl} />

            <a
              href="https://line.me/ti/p/tEgkF7b0Vg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-4 text-sm font-semibold tracking-[0.12em] text-stone-700 transition hover:border-stone-900 hover:bg-stone-50"
            >
              ติดต่อส่วนตัวผ่าน LINE
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
