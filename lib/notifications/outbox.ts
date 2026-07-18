import "server-only";

import { sendBookingCreatedNotification } from "@/lib/notifications/discord";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportOperationalError } from "@/lib/monitoring";

type OutboxClaim = {
  id: string;
  booking_id: string;
  event_type: "booking_created";
  attempts: number;
};

export async function processOutboxItem(item: OutboxClaim) {
  const supabase = createAdminClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "booking_no,fullname,phone,line,booking_date,start_time,end_time,graduates,university,faculty,total_price"
    )
    .eq("id", item.booking_id)
    .maybeSingle();

  if (error || !booking) {
    const { error: updateError } = await supabase
      .from("notification_outbox")
      .update({
        status: "failed",
        last_error: "BOOKING_NOT_FOUND",
        next_attempt_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      .eq("id", item.id);
    if (updateError) throw new Error("OUTBOX_UPDATE_FAILED");
    if (item.attempts === 8) {
      await reportOperationalError({
        event: "notification_outbox_exhausted",
        requestId: item.id,
        code: "BOOKING_NOT_FOUND",
      });
    }
    return false;
  }

  const result = await sendBookingCreatedNotification(booking);
  if (result.ok) {
    const { error: updateError } = await supabase
      .from("notification_outbox")
      .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
      .eq("id", item.id);
    if (updateError) throw new Error("OUTBOX_UPDATE_FAILED");
    return true;
  }

  const backoffMinutes = Math.min(360, 2 ** Math.max(0, item.attempts));
  const { error: updateError } = await supabase
    .from("notification_outbox")
    .update({
      status: "failed",
      last_error: result.code.slice(0, 100),
      next_attempt_at: new Date(
        Date.now() + backoffMinutes * 60 * 1000
      ).toISOString(),
    })
    .eq("id", item.id);
  if (updateError) throw new Error("OUTBOX_UPDATE_FAILED");
  if (item.attempts === 8) {
    await reportOperationalError({
      event: "notification_outbox_exhausted",
      requestId: item.id,
      code: result.code,
    });
  }
  return false;
}

export async function processPendingNotifications(limit = 10) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("claim_notification_outbox", {
    p_limit: limit,
  });
  if (error) throw new Error("OUTBOX_CLAIM_FAILED");

  const claims = (data ?? []) as OutboxClaim[];
  const results = [];
  for (const claim of claims) {
    results.push(await processOutboxItem(claim));
  }

  return { claimed: claims.length, sent: results.filter(Boolean).length };
}
