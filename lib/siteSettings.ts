import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

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
  return {
    instagram_url: value?.instagram_url?.trim() || null,
    facebook_url: value?.facebook_url?.trim() || null,
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
  } catch (error) {
    console.error("Site settings fallback parse error:", error);
    return DEFAULT_SITE_SETTINGS;
  }
}

async function ensureFallbackBucket(supabase: SupabaseClient) {
  const { error: getError } = await supabase.storage.getBucket(FALLBACK_BUCKET);

  if (!getError) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(
    FALLBACK_BUCKET,
    {
      public: false,
    }
  );

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw createError;
  }
}

async function writeStorageSettings(
  supabase: SupabaseClient,
  settings: SiteSettings
) {
  await ensureFallbackBucket(supabase);

  const body = JSON.stringify(settings, null, 2);
  const { error } = await supabase.storage
    .from(FALLBACK_BUCKET)
    .upload(FALLBACK_PATH, body, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) {
    throw error;
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

    console.error("Site settings query error:", error);
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

export async function saveSiteSettings(
  settings: SiteSettings,
  supabase: SupabaseClient = supabaseServer
) {
  const normalized = normalizeSettings(settings);

  const { error } = await supabase.from("site_settings").upsert(
    {
      id: 1,
      ...normalized,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    }
  );

  if (error && !isMissingTableError(error)) {
    throw error;
  }

  await writeStorageSettings(supabase, normalized);
}
