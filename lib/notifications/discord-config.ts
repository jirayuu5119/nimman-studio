export function selectBookingNotificationWebhook(
  environment: Record<string, string | undefined>
) {
  return (
    environment.DISCORD_WEBHOOK_URL?.trim() ||
    environment.OPERATIONAL_ALERT_WEBHOOK_URL?.trim() ||
    null
  );
}
