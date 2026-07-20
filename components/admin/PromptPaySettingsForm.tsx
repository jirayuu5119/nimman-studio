"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { QrCode, Upload } from "lucide-react";
import { updatePaymentSettings } from "@/app/admin/actions";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import {
  describeSelectedFile,
  INITIAL_ADMIN_FORM_STATE,
  type AdminFormState,
} from "@/lib/admin-form-state";

type PromptPaySettingsFormProps = {
  promptpayNumber: string;
  qrPreviewUrl: string;
};

export function PromptPaySettingsForm({
  promptpayNumber,
  qrPreviewUrl,
}: PromptPaySettingsFormProps) {
  const [selectedFileName, setSelectedFileName] = useState<string>();
  const [localPreview, setLocalPreview] = useState<string>();
  const [state, formAction] = useActionState(
    async (_previous: AdminFormState, formData: FormData) => {
      try {
        await updatePaymentSettings(formData);
        return {
          tone: "success" as const,
          message: "บันทึกข้อมูลการรับชำระเงินแล้ว",
        };
      } catch {
        return {
          tone: "error" as const,
          message: "บันทึกไม่สำเร็จ กรุณาตรวจสอบเลข PromptPay และไฟล์รูป",
        };
      }
    },
    INITIAL_ADMIN_FORM_STATE
  );

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  return (
    <section
      id="payments"
      aria-labelledby="payments-heading"
      className="admin-panel admin-section p-4 sm:p-5"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
          <QrCode aria-hidden="true" size={20} />
        </span>
        <div>
          <p className="text-xs font-medium text-[var(--admin-accent)]">การรับชำระเงิน</p>
          <h2 id="payments-heading" className="mt-1 text-lg font-bold">
            PromptPay และรูป QR รับโอน
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
            รูปเดิมจะยังใช้งานต่อหากไม่ได้เลือกไฟล์ใหม่
          </p>
        </div>
      </div>

      <form action={formAction} className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-2.5">
          <Image
            src={localPreview ?? qrPreviewUrl}
            alt={localPreview ? "ตัวอย่าง QR PromptPay ที่เลือก" : "QR PromptPay ปัจจุบัน"}
            width={320}
            height={320}
            unoptimized
            className="aspect-square h-auto w-full rounded-lg bg-white object-contain"
          />
        </div>

        <div className="space-y-3">
          <label htmlFor="promptpay-number" className="block text-sm font-medium">
            เลข PromptPay
            <input
              id="promptpay-number"
              name="promptpayNumber"
              inputMode="numeric"
              required
              minLength={10}
              maxLength={15}
              defaultValue={promptpayNumber}
              placeholder="กรอกเลข PromptPay 10-15 หลัก"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3.5 text-sm outline-none focus:bg-white"
            />
          </label>

          <label htmlFor="promptpay-qr" className="block text-sm font-medium">
            รูป QR / รูปรับโอนเงิน
            <input
              id="promptpay-qr"
              name="promptpayQr"
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                setSelectedFileName(file?.name);
                setLocalPreview(file ? URL.createObjectURL(file) : undefined);
              }}
              className="mt-1.5 block min-h-11 w-full rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--admin-sidebar)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            />
          </label>
          <p className="text-xs text-[var(--admin-muted)]">
            {describeSelectedFile(selectedFileName)} · รองรับ JPG หรือ PNG ไม่เกิน 3 MB
          </p>

          <AdminSubmitButton
            idleLabel="บันทึกข้อมูลการรับเงิน"
            pendingLabel="กำลังอัปโหลด..."
            icon={<Upload aria-hidden="true" size={16} />}
            className="w-full sm:w-auto"
          />

          <p
            aria-live="polite"
            className={`min-h-5 text-sm ${
              state.tone === "error" ? "text-red-700" : "text-emerald-700"
            }`}
          >
            {state.message}
          </p>
        </div>
      </form>
    </section>
  );
}
