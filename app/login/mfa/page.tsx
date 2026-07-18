import { redirect } from "next/navigation";
import MfaGate from "@/components/admin/MfaGate";
import { getAdminAccess } from "@/lib/auth/require-admin";

export default async function MfaPage() {
  const access = await getAdminAccess();
  if (access.status === "authorized") redirect("/admin");
  if (access.status !== "mfa_required") redirect("/login");

  return <MfaGate />;
}
