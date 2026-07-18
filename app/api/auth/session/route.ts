import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseAuthCookieName } from "@/lib/auth/session-recovery";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ cleared: true });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    for (const cookie of request.cookies.getAll()) {
      if (isSupabaseAuthCookieName(cookie.name, supabaseUrl)) {
        response.cookies.delete(cookie.name);
      }
    }
  }

  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
