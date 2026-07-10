import "server-only";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export type AdminContext = {
  userId: string;
  role: "owner" | "admin";
};

export async function getAdminContext(): Promise<AdminContext | null> {
  const authClient = await createServerAuthClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) return null;

  const adminClient = createAdminClient();
  const { data, error: roleError } = await adminClient
    .from("admin_users")
    .select("role,active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError || !data?.active || !["owner", "admin"].includes(data.role)) {
    return null;
  }

  return { userId: user.id, role: data.role as AdminContext["role"] };
}

export async function requireAdmin() {
  const admin = await getAdminContext();
  if (!admin) redirect("/login");
  return admin;
}
