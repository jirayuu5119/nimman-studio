export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("66") && digits.length === 11) {
    return `0${digits.slice(2)}`;
  }

  return digits;
}

export function isValidThaiPhone(value: string) {
  return /^0\d{9}$/.test(normalizePhone(value));
}

export function isValidLegacyLookupPhone(value: string) {
  return /^0\d{8,14}$/.test(normalizePhone(value));
}
