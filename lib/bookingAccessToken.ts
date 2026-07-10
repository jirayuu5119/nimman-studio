import { createHmac, timingSafeEqual } from "node:crypto";

function getSigningSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Missing booking access signing secret");
  }

  return secret;
}

export function createBookingAccessToken(bookingNo: string) {
  return createHmac("sha256", getSigningSecret())
    .update(bookingNo)
    .digest("hex");
}

export function verifyBookingAccessToken(
  bookingNo: string,
  token: string
) {
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return false;
  }

  const expected = Buffer.from(createBookingAccessToken(bookingNo), "hex");
  const received = Buffer.from(token, "hex");

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}
