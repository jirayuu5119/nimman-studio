import "server-only";

import { processPendingNotifications } from "@/lib/notifications/outbox";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDaysToDateKey, getBangkokDateKey } from "@/lib/booking-rules";
import { parseCustomerDataRetentionDays } from "@/lib/privacy";
import { parseOrphanSlipRetentionHours } from "@/lib/retention";

type StorageEntry = {
  name: string;
  created_at?: string;
  metadata?: unknown;
};

type SlipReference = {
  slip_path: string | null;
  slip_url: string | null;
};

type RetentionCandidate = SlipReference & {
  id: string;
};

function legacySlipPath(slipUrl: string | null) {
  if (!slipUrl) return null;

  try {
    const url = new URL(slipUrl);
    const marker = "/storage/v1/object/public/slips/";
    if (!url.pathname.startsWith(marker)) return null;
    const path = decodeURIComponent(url.pathname.slice(marker.length));
    return path && !path.includes("..") ? path : null;
  } catch {
    return null;
  }
}

function configuredOrphanGraceMs() {
  const hours = parseOrphanSlipRetentionHours(
    process.env.ORPHAN_SLIP_RETENTION_HOURS
  );
  if (hours === null) return null;
  return hours * 60 * 60 * 1000;
}

async function listSlipFiles(prefix = "", depth = 0, graceMs = 0): Promise<string[]> {
  if (depth > 3) return [];
  const supabase = createAdminClient();
  const paths: string[] = [];

  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from("slips").list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error("SLIP_LIST_FAILED");

    const entries = (data ?? []) as StorageEntry[];
    for (const entry of entries) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.metadata == null) {
        paths.push(...(await listSlipFiles(path, depth + 1, graceMs)));
        continue;
      }

      if (!entry.created_at) continue;
      const createdAt = Date.parse(entry.created_at);
      if (Number.isFinite(createdAt) && Date.now() - createdAt > graceMs) {
        paths.push(path);
      }
    }

    if (entries.length < 1000) break;
  }
  return paths;
}

async function removeConfirmedOrphanSlips() {
  const graceMs = configuredOrphanGraceMs();
  // Deletion is opt-in. This prevents an unconfigured cron from deleting valid
  // customer files during the slip_url -> slip_path transition.
  if (graceMs === null) return 0;

  const supabase = createAdminClient();
  const referenced = new Set<string>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("bookings")
      .select("slip_path,slip_url")
      .range(offset, offset + 999);
    if (error) throw new Error("SLIP_REFERENCE_QUERY_FAILED");

    for (const row of (data ?? []) as SlipReference[]) {
      if (row.slip_url?.trim() && !legacySlipPath(row.slip_url)) {
        return 0;
      }

      const paths = [row.slip_path?.trim() || null, legacySlipPath(row.slip_url)];
      for (const path of paths) {
        if (path) referenced.add(path);
      }
    }

    if ((data ?? []).length < 1000) break;
  }
  const candidates = (await listSlipFiles("", 0, graceMs)).filter(
    (path) => !referenced.has(path)
  );
  const toDelete = candidates.slice(0, 100);
  if (toDelete.length === 0) return 0;

  const { error: removeError } = await supabase.storage
    .from("slips")
    .remove(toDelete);
  if (removeError) throw new Error("ORPHAN_SLIP_REMOVE_FAILED");
  return toDelete.length;
}

async function anonymizeExpiredBookings() {
  const retentionDays = parseCustomerDataRetentionDays(
    process.env.CUSTOMER_DATA_RETENTION_DAYS
  );
  if (retentionDays === null) return 0;

  const cutoffDate = addDaysToDateKey(getBangkokDateKey(), -retentionDays);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id,slip_path,slip_url")
    .in("status", ["completed", "cancelled"])
    .is("data_anonymized_at", null)
    .lt("booking_date", cutoffDate)
    .order("booking_date", { ascending: true })
    .limit(50);
  if (error) throw new Error("RETENTION_CANDIDATE_QUERY_FAILED");

  const candidates = (data ?? []) as RetentionCandidate[];
  if (candidates.length === 0) return 0;
  const ids = candidates.map((candidate) => candidate.id);

  const { data: redacted, error: redactError } = await supabase
    .from("bookings")
    .update({
      fullname: "ข้อมูลถูกลบตามนโยบาย",
      phone: "0000000000",
      line: null,
      facebook: null,
      university: null,
      faculty: null,
      note: null,
    })
    .in("id", ids)
    .in("status", ["completed", "cancelled"])
    .lt("booking_date", cutoffDate)
    .is("data_anonymized_at", null)
    .select("id");
  if (redactError) throw new Error("RETENTION_REDACTION_FAILED");

  const redactedIds = (redacted ?? []).map((row) => row.id);
  if (redactedIds.length === 0) return 0;
  const redactedIdSet = new Set(redactedIds);
  const redactedCandidates = candidates.filter((candidate) =>
    redactedIdSet.has(candidate.id)
  );

  const slipPaths = Array.from(
    new Set(
      redactedCandidates.flatMap((candidate) =>
        [candidate.slip_path, legacySlipPath(candidate.slip_url)].filter(
          (path): path is string => Boolean(path)
        )
      )
    )
  );
  if (slipPaths.length > 0) {
    const { error: removeError } = await supabase.storage
      .from("slips")
      .remove(slipPaths);
    if (removeError) throw new Error("RETENTION_SLIP_REMOVE_FAILED");
  }

  const anonymizedAt = new Date().toISOString();
  const { data: anonymized, error: finalizeError } = await supabase
    .from("bookings")
    .update({
      slip_path: null,
      slip_url: null,
      data_anonymized_at: anonymizedAt,
    })
    .in("id", redactedIds)
    .is("data_anonymized_at", null)
    .select("id");
  if (finalizeError) throw new Error("RETENTION_FINALIZE_FAILED");

  const anonymizedIds = (anonymized ?? []).map((row) => row.id);
  if (anonymizedIds.length === 0) return 0;

  const { error: sessionDeleteError } = await supabase
    .from("booking_access_sessions")
    .delete()
    .in("booking_id", anonymizedIds);
  if (sessionDeleteError) throw new Error("RETENTION_SESSION_DELETE_FAILED");

  const { error: auditError } = await supabase.from("audit_logs").insert({
    resource_type: "booking_retention",
    action: "customer_data_anonymized",
    metadata: {
      count: anonymizedIds.length,
      cutoff_date: cutoffDate,
      retention_days: retentionDays,
    },
  });
  if (auditError) throw new Error("RETENTION_AUDIT_FAILED");

  return anonymizedIds.length;
}

export async function runMaintenance() {
  const supabase = createAdminClient();
  const notifications = await processPendingNotifications(20);
  const { data: cleanup, error } = await supabase.rpc(
    "cleanup_expired_security_records"
  );
  if (error) throw new Error("SECURITY_RECORD_CLEANUP_FAILED");

  const orphanSlipsRemoved = await removeConfirmedOrphanSlips();
  const bookingsAnonymized = await anonymizeExpiredBookings();
  return { notifications, cleanup, orphanSlipsRemoved, bookingsAnonymized };
}
