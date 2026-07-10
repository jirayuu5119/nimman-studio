import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createOpaqueToken, hashToken } from "@/lib/security/tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestId, logServerError } from "@/lib/security/request";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "nimman_visitor";
const VISITOR_MAX_AGE = 30 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const rateLimit = await consumeRateLimit(request, "page-visit", 30, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: true },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const existing = request.cookies.get(VISITOR_COOKIE)?.value;
    const visitorToken =
      existing && /^[a-zA-Z0-9_-]{20,200}$/.test(existing)
        ? existing
        : createOpaqueToken();

    const supabase = createAdminClient();
    const { error } = await supabase.rpc("record_page_visit", {
      p_page: "booking",
      p_visitor_hash: hashToken(visitorToken),
    });
    if (error) throw new Error("PAGE_VISIT_WRITE_FAILED");

    const response = NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
    if (visitorToken !== existing) {
      response.cookies.set(VISITOR_COOKIE, visitorToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: VISITOR_MAX_AGE,
      });
    }
    return response;
  } catch (error) {
    logServerError(
      "booking_page_view",
      requestId,
      error instanceof Error ? error.message.slice(0, 100) : "UNKNOWN"
    );
    return NextResponse.json(
      { success: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
