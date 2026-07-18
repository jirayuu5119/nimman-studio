import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isStaleSessionError,
  isSupabaseAuthCookieName,
} from "@/lib/auth/session-recovery";

function clearAuthCookies(
  response: NextResponse,
  request: NextRequest,
  supabaseUrl: string
) {
  for (const cookie of request.cookies.getAll()) {
    if (isSupabaseAuthCookieName(cookie.name, supabaseUrl)) {
      response.cookies.delete(cookie.name);
    }
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the signed-in session. Authorization remains enforced in the
  // server layout and every server action.
  const { error: authError } = await supabase.auth.getUser();

  if (isStaleSessionError(authError)) {
    console.warn("[auth] Cleared a stale browser session", {
      path: request.nextUrl.pathname,
      code: authError?.code ?? "unknown",
    });

    if (request.nextUrl.pathname.startsWith("/admin")) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("session", "expired");
      const redirect = NextResponse.redirect(loginUrl);
      clearAuthCookies(redirect, request, url);
      return redirect;
    }

    clearAuthCookies(response, request, url);
  }

  const sensitivePage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/booking/status") ||
    request.nextUrl.pathname.startsWith("/booking/success");

  if (sensitivePage) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
