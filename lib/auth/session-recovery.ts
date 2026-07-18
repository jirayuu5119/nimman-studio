type AuthErrorLike = {
  code?: string | null;
};

const STALE_SESSION_ERROR_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
]);

export function isStaleSessionError(error: AuthErrorLike | null | undefined) {
  return Boolean(error?.code && STALE_SESSION_ERROR_CODES.has(error.code));
}

export function getSupabaseAuthCookiePrefix(supabaseUrl: string) {
  try {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    return projectRef ? `sb-${projectRef}-auth-token` : null;
  } catch {
    return null;
  }
}

export function isSupabaseAuthCookieName(
  cookieName: string,
  supabaseUrl: string
) {
  const prefix = getSupabaseAuthCookiePrefix(supabaseUrl);
  if (!prefix) return false;

  return (
    cookieName === prefix ||
    cookieName.startsWith(`${prefix}.`) ||
    cookieName.startsWith(`${prefix}-`)
  );
}
