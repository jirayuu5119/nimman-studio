import "server-only";

import { processPendingNotifications } from "@/lib/notifications/outbox";
import { createAdminClient } from "@/lib/supabase/admin";

type StorageEntry = {
  name: string;
  created_at?: string;
  metadata?: unknown;
};

type SlipReference = {
  slip_path: string | null;
  slip_url: string | null;
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
  const raw = process.env.ORPHAN_SLIP_RETENTION_HOURS;
  if (!raw) return null;

  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours < 24 || hours > 24 * 365) return null;
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

export async function runMaintenance() {
  const supabase = createAdminClient();
  const notifications = await processPendingNotifications(20);
  const { data: cleanup, error } = await supabase.rpc(
    "cleanup_expired_security_records"
  );
  if (error) throw new Error("SECURITY_RECORD_CLEANUP_FAILED");

  const orphanSlipsRemoved = await removeConfirmedOrphanSlips();
  return { notifications, cleanup, orphanSlipsRemoved };
}
