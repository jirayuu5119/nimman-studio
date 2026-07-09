"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { saveSiteSettings } from "@/lib/siteSettings";

type BookingPeriod = "morning" | "afternoon";
const ACTIVE_BOOKING_STATUSES = ["pending", "paid", "confirmed", "completed"];

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

export async function blockCalendarDay(formData: FormData) {
  const bookingDate = String(formData.get("bookingDate") ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    throw new Error("Invalid booking date");
  }

  const supabase = createAdminClient();

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("period")
    .eq("booking_date", bookingDate)
    .in("status", ACTIVE_BOOKING_STATUSES);

  if (bookingsError) {
    throw bookingsError;
  }

  const bookedPeriods = new Set(
    (bookings ?? []).map((booking) => booking.period as BookingPeriod)
  );

  const slotsToBlock = (["morning", "afternoon"] as BookingPeriod[])
    .filter((period) => !bookedPeriods.has(period))
    .map((period) => ({
      booking_date: bookingDate,
      period,
      reason: "Closed full day from admin calendar",
    }));

  if (slotsToBlock.length > 0) {
    const { error } = await supabase.from("blocked_slots").upsert(slotsToBlock, {
      onConflict: "booking_date,period",
      ignoreDuplicates: true,
    });

    if (error) {
      throw error;
    }
  }

  revalidatePath("/admin/calendar");
}

function normalizeUrl(value: FormDataEntryValue | null) {
  const url = String(value ?? "").trim();

  if (!url) {
    return null;
  }

  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }

  return url;
}

export async function updatePortfolioLinks(formData: FormData) {
  const instagramUrl = normalizeUrl(formData.get("instagramUrl"));
  const facebookUrl = normalizeUrl(formData.get("facebookUrl"));
  const supabase = createAdminClient();

  await saveSiteSettings(
    {
      instagram_url: instagramUrl,
      facebook_url: facebookUrl,
    },
    supabase
  );

  revalidatePath("/admin");
  revalidatePath("/booking");
}
