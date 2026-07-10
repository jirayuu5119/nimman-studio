import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";
import { getRequestId, logServerError } from "@/lib/security/request";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const settings = await getSiteSettings();
    return NextResponse.json(
      {
        instagramUrl: settings.instagram_url ?? "",
        facebookUrl: settings.facebook_url ?? "",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    logServerError(
      "site_settings_read",
      requestId,
      error instanceof Error ? error.message.slice(0, 100) : "UNKNOWN"
    );
    return NextResponse.json(
      { error: "โหลดข้อมูลเว็บไซต์ไม่สำเร็จ", requestId },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
