export const CUSTOMER_DATA_RETENTION_DAYS = 365;
export const ORPHAN_SLIP_RETENTION_HOURS = 720;
export const MIN_ORPHAN_SLIP_RETENTION_HOURS = 24;
export const MAX_ORPHAN_SLIP_RETENTION_HOURS = 24 * 365;

export function parseOrphanSlipRetentionHours(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  const hours = Number(value);
  return Number.isInteger(hours) &&
    hours >= MIN_ORPHAN_SLIP_RETENTION_HOURS &&
    hours <= MAX_ORPHAN_SLIP_RETENTION_HOURS
    ? hours
    : null;
}
