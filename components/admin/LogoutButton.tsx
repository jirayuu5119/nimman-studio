"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={cn(
        "admin-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/14",
        className
      )}
    >
      <LogOut aria-hidden="true" size={17} />
      ออกจากระบบ
    </button>
  );
}
