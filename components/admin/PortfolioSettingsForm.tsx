"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { updatePortfolioLinks } from "@/app/admin/actions";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import {
  INITIAL_ADMIN_FORM_STATE,
  type AdminFormState,
} from "@/lib/admin-form-state";

type PortfolioSettingsFormProps = {
  instagramUrl: string;
  facebookUrl: string;
};

export function PortfolioSettingsForm({
  instagramUrl,
  facebookUrl,
}: PortfolioSettingsFormProps) {
  const [instagram, setInstagram] = useState(instagramUrl);
  const [facebook, setFacebook] = useState(facebookUrl);
  const [copied, setCopied] = useState<"instagram" | "facebook" | null>(null);
  const copyResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, formAction] = useActionState(
    async (_previous: AdminFormState, formData: FormData) => {
      try {
        await updatePortfolioLinks(formData);
        return { tone: "success" as const, message: "บันทึกลิงก์ผลงานแล้ว" };
      } catch {
        return {
          tone: "error" as const,
          message: "บันทึกลิงก์ไม่สำเร็จ กรุณาตรวจสอบ URL แล้วลองอีกครั้ง",
        };
      }
    },
    INITIAL_ADMIN_FORM_STATE
  );

  useEffect(() => {
    return () => {
      if (copyResetTimeout.current) clearTimeout(copyResetTimeout.current);
    };
  }, []);

  const copyLink = async (kind: "instagram" | "facebook", value: string) => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      if (copyResetTimeout.current) clearTimeout(copyResetTimeout.current);
      copyResetTimeout.current = setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-heading"
      className="admin-panel admin-section p-4 sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--admin-accent)]">ลิงก์ผลงาน</p>
          <h2 id="portfolio-heading" className="mt-1 text-lg font-bold">
            ปุ่มชมผลงานบนหน้าเว็บจอง
          </h2>
        </div>
        <Link
          href="/booking"
          target="_blank"
          rel="noreferrer"
          className="admin-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] px-3.5 text-sm font-semibold hover:border-[var(--admin-accent)]"
        >
          <ExternalLink aria-hidden="true" size={16} />
          เปิดหน้าเว็บจอง
        </Link>
      </div>

      <form action={formAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
        <label htmlFor="instagram-url" className="block text-sm font-medium">
          ลิงก์ Instagram
          <span className="mt-1.5 flex rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] focus-within:bg-white">
            <input
              id="instagram-url"
              name="instagramUrl"
              type="url"
              value={instagram}
              onChange={(event) => setInstagram(event.target.value)}
              placeholder="https://www.instagram.com/..."
              className="min-h-11 min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none"
            />
            <button
              type="button"
              aria-label={
                copied === "instagram"
                  ? "คัดลอกลิงก์ Instagram แล้ว"
                  : "คัดลอกลิงก์ Instagram"
              }
              onClick={() => copyLink("instagram", instagram)}
              className="admin-focus inline-flex size-11 items-center justify-center text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
            >
              {copied === "instagram" ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </span>
        </label>

        <label htmlFor="facebook-url" className="block text-sm font-medium">
          ลิงก์ Facebook
          <span className="mt-1.5 flex rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] focus-within:bg-white">
            <input
              id="facebook-url"
              name="facebookUrl"
              type="url"
              value={facebook}
              onChange={(event) => setFacebook(event.target.value)}
              placeholder="https://www.facebook.com/..."
              className="min-h-11 min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none"
            />
            <button
              type="button"
              aria-label={
                copied === "facebook"
                  ? "คัดลอกลิงก์ Facebook แล้ว"
                  : "คัดลอกลิงก์ Facebook"
              }
              onClick={() => copyLink("facebook", facebook)}
              className="admin-focus inline-flex size-11 items-center justify-center text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
            >
              {copied === "facebook" ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </span>
        </label>

        <AdminSubmitButton
          idleLabel="บันทึกลิงก์"
          pendingLabel="กำลังบันทึก..."
          icon={<Link2 aria-hidden="true" size={16} />}
          className="self-end"
        />
      </form>

      <p
        aria-live="polite"
        className={`mt-3 min-h-5 text-sm ${
          state.tone === "error" ? "text-red-700" : "text-emerald-700"
        }`}
      >
        {state.message}
      </p>
    </section>
  );
}
