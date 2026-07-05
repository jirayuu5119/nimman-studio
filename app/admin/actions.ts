"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateBookingStatus(
  id: string,
  status: string
) {
  const { error } = await supabase
    .from("bookings")
    .update({
      status,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}