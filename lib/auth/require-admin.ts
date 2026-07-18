import "server-only";

import { redirect } from "next/navigation";
import {
  determineAdminAccess,
  type AdminAccessStatus,
  type AdminRole,
} from "@/lib/auth/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export type AdminContext = {
  userId: string;
  role: AdminRole;
};

export type AdminAccess = {
  status: AdminAccessStatus;
  admin: AdminContext | null;
};

export async function getAdminAccess(): Promise<AdminAccess> {
  const authClient = await createServerAuthClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) return { status: "unauthenticated", admin: null };

  const adminClient = createAdminClient();
  const { data, error: roleError } = await adminClient
    .from("admin_users")
    .select("role,active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError) return { status: "forbidden", admin: null };

  const { data: assurance, error: assuranceError } =
    await authClient.auth.mfa.getAuthenticatorAssuranceLevel();
  const status = determineAdminAccess({
    authenticated: true,
    active: data?.active,
    role: data?.role,
    currentLevel: assuranceError ? null : assurance.currentLevel,
  });

  if (!data || status === "forbidden") {
    return { status, admin: null };
  }

  return {
    status,
    admin: { userId: user.id, role: data.role as AdminRole },
  };
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const access = await getAdminAccess();
  return access.status === "authorized" ? access.admin : null;
}

export async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "mfa_required") redirect("/login/mfa");
  if (access.status !== "authorized" || !access.admin) redirect("/login");
  return access.admin;
}
