export const DEFAULT_PROMPTPAY_NUMBER = "8302376723";
export const DEFAULT_PROMPTPAY_QR_URL = "/promptpay-qr.png";

export function normalizePromptPayNumber(value: unknown) {
  const normalized = String(value ?? "").replace(/[\s-]/g, "");
  if (!/^\d{10,15}$/.test(normalized)) {
    throw new Error("INVALID_PROMPTPAY_NUMBER");
  }
  return normalized;
}
