"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function updateBookingStatus(
  id: string,
  status: "confirmed" | "cancelled"
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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