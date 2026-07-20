type ReplayCandidate = {
  id: string;
  booking_id: string;
  event_type: string;
  attempts: number;
  status: string;
};

export type FailedReplayCandidate = ReplayCandidate & {
  event_type: "booking_created";
  status: "failed";
};

export function parseReplayBookingNumber(arguments_: string[]) {
  if (arguments_.length !== 1) throw new Error("REPLAY_BOOKING_REQUIRED");
  const bookingNumber = arguments_[0];
  if (!/^NF-\d{8}-\d{4}$/.test(bookingNumber)) {
    throw new Error("REPLAY_BOOKING_INVALID");
  }
  return bookingNumber;
}

export function requireFailedReplayCandidate(
  candidate: ReplayCandidate
): FailedReplayCandidate {
  if (candidate.event_type !== "booking_created") {
    throw new Error("REPLAY_EVENT_INVALID");
  }
  if (candidate.status === "sent") throw new Error("REPLAY_ALREADY_SENT");
  if (candidate.status !== "failed") throw new Error("REPLAY_NOT_FAILED");
  return candidate as FailedReplayCandidate;
}
