export type AdminRole = "owner" | "admin";

export type AdminAccessStatus =
  | "unauthenticated"
  | "forbidden"
  | "mfa_required"
  | "authorized";

export function determineAdminAccess(input: {
  authenticated: boolean;
  active?: boolean;
  role?: string | null;
  currentLevel?: string | null;
}): AdminAccessStatus {
  if (!input.authenticated) return "unauthenticated";
  if (!input.active || !["owner", "admin"].includes(input.role ?? "")) {
    return "forbidden";
  }
  return input.currentLevel === "aal2" ? "authorized" : "mfa_required";
}
