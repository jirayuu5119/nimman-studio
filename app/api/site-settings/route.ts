import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("site_settings")
    .select("instagram_url, facebook_url")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Site settings query error:", error);

    return NextResponse.json({
      instagramUrl: "",
      facebookUrl: "",
    });
  }

  return NextResponse.json({
    instagramUrl: data?.instagram_url ?? "",
    facebookUrl: data?.facebook_url ?? "",
  });
}
