import Image from "next/image";
import Feature from "@/components/Feature";
import BookingButton from "@/components/BookingButton";

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
              ระบบจองคิวถ่ายภาพรับปริญญา
              <br />
              เรียบง่าย ชัดเจน และเป็นส่วนตัว
            </p>
          </div>

          <div className="my-10 h-px w-full bg-stone-200/70" />

          <Feature />

          <div className="mt-10">
            <BookingButton />
          </div>
        </div>
      </section>
    </main>
  );
}