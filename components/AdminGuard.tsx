"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace("/login");
        return;
      }

      const { data: assurance, error } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error || assurance.currentLevel !== "aal2") {
        router.replace("/login/mfa");
        return;
      }

      setLoading(false);
    }

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>กำลังตรวจสอบสิทธิ์...</p>
      </main>
    );
  }

  return <>{children}</>;
}
