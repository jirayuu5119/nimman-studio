import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSiteSettings();

  return NextResponse.json({
    instagramUrl: settings.instagram_url ?? "",
    facebookUrl: settings.facebook_url ?? "",
  });
}
