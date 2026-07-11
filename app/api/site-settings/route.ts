import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";
import { getRequestId, logServerError } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_PROMPTPAY_QR_URL } from "@/lib/payment-settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const supabase = createAdminClient();
    const settings = await getSiteSettings(supabase);
    let promptpayQrUrl = DEFAULT_PROMPTPAY_QR_URL;

    if (settings.promptpay_qr_path) {
      const { data } = await supabase.storage
        .from("site-config")
        .createSignedUrl(settings.promptpay_qr_path, 60 * 60);
      if (data?.signedUrl) promptpayQrUrl = data.signedUrl;
    }

    return NextResponse.json(
      {
        instagramUrl: settings.instagram_url ?? "",
        facebookUrl: settings.facebook_url ?? "",
        promptpayNumber: settings.promptpay_number,
        promptpayQrUrl,
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
