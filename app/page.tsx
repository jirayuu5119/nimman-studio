import Hero from "@/components/Hero";
import Feature from "@/components/Feature";
import BookingButton from "@/components/BookingButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f5f0] px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-xl rounded-[2rem] border border-stone-200/70 bg-white/90 px-8 py-10 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur md:px-12 md:py-14">
          <Hero />

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