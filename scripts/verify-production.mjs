import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("Supabase production verification variables are required");
}

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 1 } },
};
const service = createClient(url, serviceRoleKey, clientOptions);
const anonymous = createClient(url, anonKey, clientOptions);

const health = await fetch(`${url}/auth/v1/health`, {
  headers: { apikey: anonKey },
});

const schemaProbe = await service
  .from("bookings")
  .select("id,privacy_notice_version,privacy_acknowledged_at,data_anonymized_at")
  .limit(1);

const anonymousProbe = await anonymous.from("bookings").select("id").limit(1);

const result = {
  authHealthy: health.ok,
  privacyColumnsReadableByServer: schemaProbe.error === null,
  bookingsBlockedForAnonymous:
    anonymousProbe.error?.code === "42501" ||
    anonymousProbe.error?.code === "PGRST301",
};

console.log(JSON.stringify(result));
if (Object.values(result).some((value) => value !== true)) process.exit(1);
