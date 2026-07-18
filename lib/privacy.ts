export const PRIVACY_NOTICE_VERSION = "2026-07-18";
export const MIN_RETENTION_DAYS = 365;
export const MAX_RETENTION_DAYS = 3650;

export function parseCustomerDataRetentionDays(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const days = Number(value);
  return Number.isInteger(days) &&
    days >= MIN_RETENTION_DAYS &&
    days <= MAX_RETENTION_DAYS
    ? days
    : null;
}
