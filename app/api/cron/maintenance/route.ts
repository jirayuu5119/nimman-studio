import { NextResponse } from "next/server";
import { runMaintenance } from "@/lib/maintenance";
import { isAuthorizedCron } from "@/lib/security/cron";
import { getRequestId, logServerError } from "@/lib/security/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  if (!isAuthorizedCron(request)) {
    return NextResponse.json(
      { error: "Unauthorized", requestId },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const result = await runMaintenance();
    return NextResponse.json(
      { success: true, ...result },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    logServerError(
      "maintenance",
      requestId,
      error instanceof Error ? error.message.slice(0, 100) : "UNKNOWN"
    );
    return NextResponse.json(
      { success: false, error: "Maintenance failed", requestId },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
