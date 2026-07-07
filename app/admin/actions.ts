"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

type BookingPeriod = "morning" | "afternoon";

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function updateBookingStatus(
  id: string,
  status: "confirmed" | "cancelled" | "completed"
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      status,
    })
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath(`/admin/bookings/${id}`);
}

export async function blockCalendarSlot(formData: FormData) {
  const bookingDate = String(formData.get("bookingDate") ?? "");
  const period = String(formData.get("period") ?? "") as BookingPeriod;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    throw new Error("Invalid booking date");
  }

  if (period !== "morning" && period !== "afternoon") {
    throw new Error("Invalid booking period");
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("blocked_slots").insert({
    booking_date: bookingDate,
    period,
    reason: "Closed from admin calendar",
  });

  if (error && error.code !== "23505") {
    throw error;
  }

  revalidatePath("/admin/calendar");
}
