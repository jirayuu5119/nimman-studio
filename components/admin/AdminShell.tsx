"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import LogoutButton from "@/components/admin/LogoutButton";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const handleNavigate = (href: string) => {
    const nextHash = href.includes("#") ? `#${href.split("#")[1]}` : "";
    setHash(nextHash);
    closeDrawer();
  };

  return (
    <div className="admin-shell min-h-screen overflow-x-clip">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">
        <AdminSidebar
          pathname={pathname}
          hash={hash}
          logoutControl={<LogoutButton className="w-full justify-start" />}
        />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--admin-border)] bg-[color:var(--admin-bg)]/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full border border-[var(--admin-accent)] text-xs font-bold">
            N
          </span>
          <span className="text-sm font-extrabold tracking-[0.08em]">NIMMAN FOTO</span>
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="เปิดเมนูผู้ดูแลระบบ"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className="admin-focus inline-flex size-11 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-white text-[var(--admin-text)]"
        >
          <Menu aria-hidden="true" size={21} />
        </button>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="ปิดเมนู"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={closeDrawer}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="เมนูผู้ดูแลระบบ"
            className="absolute inset-y-0 left-0 w-[min(88vw,320px)] bg-[var(--admin-sidebar)] shadow-2xl"
          >
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="ปิดเมนู"
              onClick={closeDrawer}
              className="admin-focus absolute right-3 top-3 z-10 inline-flex size-10 items-center justify-center rounded-xl bg-white/8 text-white hover:bg-white/14"
            >
              <X aria-hidden="true" size={20} />
            </button>
            <AdminSidebar
              pathname={pathname}
              hash={hash}
              onNavigate={handleNavigate}
              logoutControl={<LogoutButton className="w-full justify-start" />}
            />
          </div>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-60">
        <div id="admin-content" className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
