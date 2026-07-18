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

export function getPublicSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://grad.jirayufoto.net";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error("UNSAFE_SITE_URL");
    }
    return url.origin;
  } catch {
    return "https://grad.jirayufoto.net";
  }
}
