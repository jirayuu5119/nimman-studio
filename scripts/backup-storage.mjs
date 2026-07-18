import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const outputRoot = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!outputRoot || !url || !serviceRoleKey) {
  throw new Error(
    "Usage: node scripts/backup-storage.mjs <output-root>; Supabase URL and service role key are required"
  );
}

const resolvedRoot = path.resolve(outputRoot);
const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 1 } },
});
const buckets = ["slips", "site-config"];
const manifest = [];

function safeDestination(bucket, objectPath) {
  const bucketRoot = path.resolve(resolvedRoot, bucket);
  const destination = path.resolve(bucketRoot, objectPath);
  if (
    destination !== bucketRoot &&
    !destination.startsWith(`${bucketRoot}${path.sep}`)
  ) {
    throw new Error("Unsafe storage object path");
  }
  return destination;
}

async function backupPrefix(bucket, prefix = "", depth = 0) {
  if (depth > 10) throw new Error("Storage nesting exceeds safe depth");

  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;

    const entries = data ?? [];
    for (const entry of entries) {
      const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.metadata == null) {
        await backupPrefix(bucket, objectPath, depth + 1);
        continue;
      }

      const { data: blob, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(objectPath);
      if (downloadError) throw downloadError;

      const destination = safeDestination(bucket, objectPath);
      await mkdir(path.dirname(destination), { recursive: true });
      const bytes = Buffer.from(await blob.arrayBuffer());
      await writeFile(destination, bytes);
      manifest.push({ bucket, path: objectPath, bytes: bytes.length });
    }

    if (entries.length < 1000) break;
  }
}

await mkdir(resolvedRoot, { recursive: true });
for (const bucket of buckets) {
  await backupPrefix(bucket);
}
await writeFile(
  path.join(resolvedRoot, "storage-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8"
);
console.log(`Backed up ${manifest.length} storage objects.`);
