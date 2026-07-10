import "server-only";

import type { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOpaqueToken, hashToken } from "@/lib/security/tokens";

export const BOOKING_ACCESS_COOKIE = "nimman_booking_access";
const SESSION_TTL_SECONDS = 24 * 60 * 60;

export async function createBookingAccessSession(bookingId: string) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const supabase = createAdminClient();
  const { error } = await supabase.from("booking_access_sessions").insert({
    booking_id: bookingId,
    token_hash: hashToken(token),
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error("BOOKING_SESSION_CREATE_FAILED");
  return { token, expiresAt };
}

export function setBookingAccessCookie(
  response: NextResponse,
  session: { token: string; expiresAt: Date }
) {
  response.cookies.set(BOOKING_ACCESS_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    expires: session.expiresAt,
  });
}

export async function hasBookingAccessSession(
  bookingId: string,
  token: string | undefined
) {
  if (!token || token.length > 200) return false;

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("booking_access_sessions")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("token_hash", hashToken(token))
    .is("revoked_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error || !data) return false;
  void supabase
    .from("booking_access_sessions")
    .update({ last_used_at: now })
    .eq("id", data.id);
  return true;
}

export async function getBookingIdFromAccessSession(token: string | undefined) {
  if (!token || token.length > 200) return null;

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("booking_access_sessions")
    .select("id,booking_id")
    .eq("token_hash", hashToken(token))
    .is("revoked_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error || !data?.booking_id) return null;
  void supabase
    .from("booking_access_sessions")
    .update({ last_used_at: now })
    .eq("id", data.id);
  return data.booking_id as string;
}

export async function revokeBookingAccessSession(sessionId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("booking_access_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", sessionId)
    .is("revoked_at", null);
  if (error) throw new Error("BOOKING_SESSION_REVOKE_FAILED");
}

export async function revokeBookingAccessForBooking(bookingId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("booking_access_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .is("revoked_at", null);
  if (error) throw new Error("BOOKING_SESSION_REVOKE_FAILED");
}
