export function parseAllowedSiteUrl(
  rawValue: string,
  allowedHosts: ReadonlySet<string>
) {
  const raw = rawValue.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Error("INVALID_SITE_URL");
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !allowedHosts.has(url.hostname.toLowerCase())
  ) {
    throw new Error("UNSAFE_SITE_URL");
  }

  url.hash = "";
  return url.toString();
}
