import { processOutboxItem } from "@/lib/notifications/outbox";
import {
  parseReplayBookingNumber,
  requireFailedReplayCandidate,
} from "@/lib/notifications/replay";
import { createAdminClient } from "@/lib/supabase/admin";

function errorCode(error: unknown) {
  return error instanceof Error
    ? error.message.replace(/[^A-Z0-9_]/gi, "_").slice(0, 100)
    : "REPLAY_FAILED";
}

async function main() {
  const bookingNumber = parseReplayBookingNumber(process.argv.slice(2));
  const supabase = createAdminClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("booking_no", bookingNumber)
    .maybeSingle();
  if (bookingError) throw new Error("REPLAY_BOOKING_LOOKUP_FAILED");
  if (!booking) throw new Error("REPLAY_BOOKING_NOT_FOUND");

  const { data: row, error: rowError } = await supabase
    .from("notification_outbox")
    .select("id,booking_id,event_type,attempts,status")
    .eq("booking_id", booking.id)
    .eq("event_type", "booking_created")
    .maybeSingle();
  if (rowError) throw new Error("REPLAY_OUTBOX_LOOKUP_FAILED");
  if (!row) throw new Error("REPLAY_OUTBOX_NOT_FOUND");
  const candidate = requireFailedReplayCandidate(row);

  const { data: claimed, error: claimError } = await supabase
    .from("notification_outbox")
    .update({
      status: "processing",
      attempts: candidate.attempts + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidate.id)
    .eq("status", "failed")
    .eq("attempts", candidate.attempts)
    .select("id,booking_id,event_type,attempts")
    .maybeSingle();
  if (claimError) throw new Error("REPLAY_CLAIM_FAILED");
  if (!claimed) throw new Error("REPLAY_ALREADY_CLAIMED");

  const sent = await processOutboxItem({
    id: claimed.id,
    booking_id: claimed.booking_id,
    event_type: "booking_created",
    attempts: claimed.attempts,
  });
  if (!sent) throw new Error("REPLAY_DELIVERY_FAILED");

  console.log(
    JSON.stringify({
      event: "booking_notification_replay",
      bookingNumber,
      result: "sent",
    })
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "booking_notification_replay",
      code: errorCode(error),
      result: "failed",
    })
  );
  process.exitCode = 1;
});
