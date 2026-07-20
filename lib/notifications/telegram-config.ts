export type TelegramConfig = {
  botToken: string;
  chatId: string;
};

export function getTelegramConfig(
  environment: Record<string, string | undefined>
): TelegramConfig | null {
  const botToken = environment.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = environment.TELEGRAM_CHAT_ID?.trim();
  return botToken && chatId ? { botToken, chatId } : null;
}
