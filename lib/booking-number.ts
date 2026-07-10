export const BOOKING_NUMBER_PATTERN = /^NF-\d{8}-\d{4}$/;

export function formatBookingNumber(dateKey: string, counter: number) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) ||
    !Number.isInteger(counter) ||
    counter < 1 ||
    counter > 9999
  ) {
    throw new Error("INVALID_BOOKING_NUMBER_INPUT");
  }

  return `NF-${dateKey.replaceAll("-", "")}-${String(counter).padStart(4, "0")}`;
}
