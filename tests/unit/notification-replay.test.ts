import { describe, expect, it } from "vitest";
import {
  parseReplayBookingNumber,
  requireFailedReplayCandidate,
} from "@/lib/notifications/replay";

describe("operator notification replay guards", () => {
  it("accepts exactly one canonical booking number", () => {
    expect(parseReplayBookingNumber(["NF-20260720-0001"])).toBe(
      "NF-20260720-0001"
    );
    expect(() => parseReplayBookingNumber([])).toThrow(
      "REPLAY_BOOKING_REQUIRED"
    );
    expect(() => parseReplayBookingNumber(["NF-1", "NF-2"])).toThrow(
      "REPLAY_BOOKING_REQUIRED"
    );
    expect(() => parseReplayBookingNumber(["nf-20260720-0001"])).toThrow(
      "REPLAY_BOOKING_INVALID"
    );
  });

  it("allows only a failed booking_created outbox row", () => {
    const failed = {
      id: "outbox-id",
      booking_id: "booking-id",
      event_type: "booking_created",
      attempts: 1,
      status: "failed",
    };
    expect(requireFailedReplayCandidate(failed)).toEqual(failed);
    expect(() =>
      requireFailedReplayCandidate({ ...failed, status: "sent" })
    ).toThrow("REPLAY_ALREADY_SENT");
    expect(() =>
      requireFailedReplayCandidate({ ...failed, status: "processing" })
    ).toThrow("REPLAY_NOT_FAILED");
  });
});
