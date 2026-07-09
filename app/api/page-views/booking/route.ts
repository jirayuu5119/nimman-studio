import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const { error } = await supabaseServer.from("page_views").insert({
    page: "booking",
  });

  if (error) {
    console.error("Page view insert error:", error);
  }

  return NextResponse.json({
    success: true,
  });
}
