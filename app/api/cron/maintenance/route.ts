import { NextResponse } from "next/server";
import { runMaintenance } from "@/lib/maintenance";
import { isAuthorizedCron } from "@/lib/security/cron";
import { getRequestId } from "@/lib/security/request";
import { logServerEvent, reportOperationalError } from "@/lib/monitoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = getRequestId(request);
  if (!isAuthorizedCron(request)) {
    return NextResponse.json(
      { error: "Unauthorized", requestId },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const result = await runMaintenance();
    logServerEvent({
      level: "info",
      event: "maintenance_complete",
      requestId,
      durationMs: Date.now() - startedAt,
      metadata: {
        notificationsClaimed: result.notifications.claimed,
        notificationsSent: result.notifications.sent,
        orphanSlipsRemoved: result.orphanSlipsRemoved,
        bookingsAnonymized: result.bookingsAnonymized,
      },
    });
    return NextResponse.json(
      { success: true, ...result },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const code =
      error instanceof Error ? error.message.slice(0, 100) : "UNKNOWN";
    await reportOperationalError({
      event: "maintenance",
      requestId,
      code,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { success: false, error: "Maintenance failed", requestId },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
