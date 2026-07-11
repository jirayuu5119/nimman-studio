"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { parseAllowedSiteUrl } from "@/lib/site-url";
import { isBookableDate } from "@/lib/booking-rules";
import { detectValidSlipType } from "@/lib/slip-validation";
import { getSiteSettings } from "@/lib/siteSettings";
import { normalizePromptPayNumber } from "@/lib/payment-settings";

type BookingPeriod = "morning" | "afternoon";
type AdminBookingStatus = "confirmed" | "cancelled" | "completed";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertDate(value: string) {
  if (!isBookableDate(value)) {
    throw new Error("Invalid booking date");
  }
}

export async function updateBookingStatus(
  id: string,
  status: AdminBookingStatus
) {
  const admin = await requireAdmin();
  if (!UUID_PATTERN.test(id) || !["confirmed", "cancelled", "completed"].includes(status)) {
    throw new Error("Invalid booking update");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("update_booking_status_atomic", {
    p_booking_id: id,
    p_to_status: status,
    p_actor_user_id: admin.userId,
  });

  if (error) throw new Error("BOOKING_STATUS_UPDATE_FAILED");
  revalidatePath("/admin");
  revalidatePath(`/admin/bookings/${id}`);
}

export async function blockCalendarSlot(formData: FormData) {
  const admin = await requireAdmin();
  const bookingDate = String(formData.get("bookingDate") ?? "");
  const period = String(formData.get("period") ?? "") as BookingPeriod;
  assertDate(bookingDate);

  if (period !== "morning" && period !== "afternoon") {
    throw new Error("Invalid booking period");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("block_booking_slot_atomic", {
    p_booking_date: bookingDate,
    p_period: period,
    p_actor_user_id: admin.userId,
  });

  if (error) throw new Error("BLOCK_SLOT_FAILED");
  revalidatePath("/admin/calendar");
}

export async function blockCalendarDay(formData: FormData) {
  const admin = await requireAdmin();
  const bookingDate = String(formData.get("bookingDate") ?? "");
  assertDate(bookingDate);

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("block_booking_day_atomic", {
    p_booking_date: bookingDate,
    p_actor_user_id: admin.userId,
  });

  if (error) throw new Error("BLOCK_DAY_FAILED");
  revalidatePath("/admin/calendar");
}

export async function updatePortfolioLinks(formData: FormData) {
  const admin = await requireAdmin();
  const instagramUrl = parseAllowedSiteUrl(
    String(formData.get("instagramUrl") ?? ""),
    new Set(["instagram.com", "www.instagram.com"])
  );
  const facebookUrl = parseAllowedSiteUrl(
    String(formData.get("facebookUrl") ?? ""),
    new Set(["facebook.com", "www.facebook.com", "m.facebook.com"])
  );

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("update_site_settings_atomic", {
    p_instagram_url: instagramUrl,
    p_facebook_url: facebookUrl,
    p_actor_user_id: admin.userId,
  });

  if (error) throw new Error("SITE_SETTINGS_UPDATE_FAILED");
  revalidatePath("/admin");
  revalidatePath("/booking");
}

const MAX_PROMPTPAY_QR_SIZE = 3_000_000;

export async function updatePaymentSettings(formData: FormData) {
  const admin = await requireAdmin();
  const promptpayNumber = normalizePromptPayNumber(
    formData.get("promptpayNumber")
  );
  const qrFile = formData.get("promptpayQr");
  const supabase = createAdminClient();
  const currentSettings = await getSiteSettings(supabase);
  let nextQrPath = currentSettings.promptpay_qr_path;
  let uploadedPath: string | null = null;

  if (qrFile instanceof File && qrFile.size > 0) {
    if (qrFile.size > MAX_PROMPTPAY_QR_SIZE) {
      throw new Error("PROMPTPAY_QR_TOO_LARGE");
    }

    const buffer = Buffer.from(await qrFile.arrayBuffer());
    const detected = await detectValidSlipType(buffer);
    if (!detected || !["jpg", "png"].includes(detected.ext)) {
      throw new Error("INVALID_PROMPTPAY_QR_FILE");
    }

    uploadedPath = `payments/promptpay-${randomUUID()}.${detected.ext}`;
    const { error: uploadError } = await supabase.storage
      .from("site-config")
      .upload(uploadedPath, buffer, {
        contentType: detected.mime,
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) throw new Error("PROMPTPAY_QR_UPLOAD_FAILED");
    nextQrPath = uploadedPath;
  }

  const { error } = await supabase.rpc("update_payment_settings_atomic", {
    p_promptpay_number: promptpayNumber,
    p_promptpay_qr_path: nextQrPath,
    p_actor_user_id: admin.userId,
  });

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from("site-config").remove([uploadedPath]);
    }
    throw new Error("PAYMENT_SETTINGS_UPDATE_FAILED");
  }

  if (
    uploadedPath &&
    currentSettings.promptpay_qr_path &&
    currentSettings.promptpay_qr_path !== uploadedPath
  ) {
    await supabase.storage
      .from("site-config")
      .remove([currentSettings.promptpay_qr_path]);
  }

  revalidatePath("/admin");
  revalidatePath("/booking/upload-slip");
  revalidatePath("/api/site-settings");
}


export async function changeAdminPassword(password: string) {
  const admin = await requireAdmin();
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  ) {
    throw new Error("รหัสผ่านต้องมี 12-128 ตัวอักษร");
  }

  const authClient = await createServerAuthClient();
  const { error } = await authClient.auth.updateUser({ password });
  if (error) throw new Error("เปลี่ยนรหัสผ่านไม่สำเร็จ");

  const supabase = createAdminClient();
  const { error: auditError } = await supabase.from("audit_logs").insert({
    resource_type: "admin_user",
    resource_id: admin.userId,
    action: "password_changed",
    actor_user_id: admin.userId,
  });
  if (auditError) throw new Error("บันทึกเหตุการณ์ความปลอดภัยไม่สำเร็จ");
}
