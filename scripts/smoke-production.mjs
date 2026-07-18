import process from "node:process";

const origin = new URL(process.env.PRODUCTION_BASE_URL ?? "https://grad.jirayufoto.net");
if (origin.protocol !== "https:") throw new Error("Production URL must use HTTPS");

const checks = [
  ["home", "/", [200]],
  ["booking", "/booking", [200]],
  ["privacy", "/privacy", [200]],
  ["robots", "/robots.txt", [200]],
  ["sitemap", "/sitemap.xml", [200]],
  ["availability", "/api/bookings/availability", [200]],
  ["admin-protected", "/admin", [307, 308]],
  ["cron-protected", "/api/cron/maintenance", [401]],
];

const failures = [];
for (const [name, path, expected] of checks) {
  try {
    const response = await fetch(new URL(path, origin), {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    console.log(`${name}: ${response.status}`);
    const isStreamedAdminRedirect =
      name === "admin-protected" &&
      response.status === 200 &&
      (await response.text()).includes("/login");
    if (!expected.includes(response.status) && !isStreamedAdminRedirect) {
      failures.push(name);
    }
  } catch {
    console.log(`${name}: request_failed`);
    failures.push(name);
  }
}

if (failures.length > 0) {
  throw new Error(`Production smoke checks failed: ${failures.join(", ")}`);
}
