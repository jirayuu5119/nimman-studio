export function getLegacySlipPath(slipUrl: string | null) {
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
