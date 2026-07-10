import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { parseAllowedSiteUrl } from "@/lib/site-url";

export type SiteSettings = {
  instagram_url: string | null;
  facebook_url: string | null;
};

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  instagram_url: null,
  facebook_url: null,
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
  supabase: SupabaseClient = supabaseServer
): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("instagram_url, facebook_url")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return readStorageSettings(supabase);
    }

    console.error("site_settings_query_failed");
    return readStorageSettings(supabase);
  }

  const tableSettings = normalizeSettings(data);

  if (tableSettings.instagram_url || tableSettings.facebook_url) {
    return tableSettings;
  }

  const storageSettings = await readStorageSettings(supabase);
  return storageSettings.instagram_url || storageSettings.facebook_url
    ? storageSettings
    : tableSettings;
}
