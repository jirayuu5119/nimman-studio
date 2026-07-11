import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseAllowedSiteUrl } from "@/lib/site-url";
import { DEFAULT_PROMPTPAY_NUMBER } from "@/lib/payment-settings";

export type SiteSettings = {
  instagram_url: string | null;
  facebook_url: string | null;
  promptpay_number: string;
  promptpay_qr_path: string | null;
};

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  instagram_url: null,
  facebook_url: null,
  promptpay_number: DEFAULT_PROMPTPAY_NUMBER,
  promptpay_qr_path: null,
};

const FALLBACK_BUCKET = "site-config";
const FALLBACK_PATH = "site-settings.json";

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;

  return (
    error.code === "PGRST205" ||
    error.message?.toLowerCase().includes("could not find the table")
  );
}

function normalizeSettings(value: Partial<SiteSettings> | null): SiteSettings {
  const normalizeUrl = (
    raw: string | null | undefined,
    hosts: ReadonlySet<string>
  ) => {
    if (!raw?.trim()) return null;
    try {
      return parseAllowedSiteUrl(raw, hosts);
    } catch {
      return null;
    }
  };

  return {
    instagram_url: normalizeUrl(
      value?.instagram_url,
      new Set(["instagram.com", "www.instagram.com"])
    ),
    facebook_url: normalizeUrl(
      value?.facebook_url,
      new Set(["facebook.com", "www.facebook.com", "m.facebook.com"])
    ),
    promptpay_number:
      typeof value?.promptpay_number === "string" &&
      /^\d{10,15}$/.test(value.promptpay_number)
        ? value.promptpay_number
        : DEFAULT_PROMPTPAY_NUMBER,
    promptpay_qr_path:
      typeof value?.promptpay_qr_path === "string" &&
      /^payments\/promptpay-[0-9a-f-]{36}\.(jpg|png)$/.test(
        value.promptpay_qr_path
      )
        ? value.promptpay_qr_path
        : null,
  };
}

async function readStorageSettings(
  supabase: SupabaseClient
): Promise<SiteSettings> {
  const { data, error } = await supabase.storage
    .from(FALLBACK_BUCKET)
    .download(FALLBACK_PATH);

  if (error || !data) {
    return DEFAULT_SITE_SETTINGS;
  }

  try {
    const parsed = JSON.parse(await data.text()) as Partial<SiteSettings>;
    return normalizeSettings(parsed);
  } catch {
    console.error("site_settings_fallback_parse_failed");
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function getSiteSettings(
  supabase?: SupabaseClient
): Promise<SiteSettings> {
  const client = supabase ?? createAdminClient();
  const { data, error } = await client
    .from("site_settings")
    .select("instagram_url,facebook_url,promptpay_number,promptpay_qr_path")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return readStorageSettings(client);
    }

    console.error("site_settings_query_failed");
    return readStorageSettings(client);
  }

  const tableSettings = normalizeSettings(data);

  if (
    tableSettings.instagram_url ||
    tableSettings.facebook_url ||
    tableSettings.promptpay_qr_path ||
    tableSettings.promptpay_number !== DEFAULT_PROMPTPAY_NUMBER
  ) {
    return tableSettings;
  }

  const storageSettings = await readStorageSettings(client);
  return storageSettings.instagram_url ||
    storageSettings.facebook_url ||
    storageSettings.promptpay_qr_path ||
    storageSettings.promptpay_number !== DEFAULT_PROMPTPAY_NUMBER
    ? storageSettings
    : tableSettings;
}
