import Hero from "@/components/Hero";
import Feature from "@/components/Feature";
import BookingButton from "@/components/BookingButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-xl w-full">

        <Hero />

        <div className="mt-10">
          <Feature />
        </div>

        <div className="mt-10">
          <BookingButton />
        </div>

      </div>
    </main>
  );
}