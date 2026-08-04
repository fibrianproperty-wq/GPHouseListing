import type {
  TelegramMessage,
} from "@/types/listing";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

/**
 * Send a plain text message to a Telegram chat
 */
export async function sendMessage(
  chatId: number,
  text: string,
  parseMode: "HTML" | "Markdown" | "MarkdownV2" = "HTML"
): Promise<TelegramMessage | null> {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error("Telegram sendMessage error:", data);
      return null;
    }
    return data.result;
  } catch (error) {
    console.error("Telegram sendMessage failed:", error);
    return null;
  }
}

/**
 * Send a message with inline keyboard buttons
 */
export async function sendMessageWithKeyboard(
  chatId: number,
  text: string,
  inlineKeyboard: Array<
    Array<{ text: string; callback_data: string }>
  >,
  parseMode: "HTML" | "Markdown" | "MarkdownV2" = "HTML"
): Promise<TelegramMessage | null> {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error("Telegram sendMessageWithKeyboard error:", data);
      return null;
    }
    return data.result;
  } catch (error) {
    console.error("Telegram sendMessageWithKeyboard failed:", error);
    return null;
  }
}

/**
 * Answer a callback query (acknowledges button press)
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Telegram answerCallbackQuery failed:", error);
    return false;
  }
}

/**
 * Set the webhook URL for the Telegram bot
 */
export async function setWebhook(url: string, secretToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: secretToken,
        allowed_updates: ["message", "callback_query"],
      }),
    });

    const data = await response.json();
    console.log("setWebhook response:", data);
    return data.ok;
  } catch (error) {
    console.error("Telegram setWebhook failed:", error);
    return false;
  }
}

/**
 * Format listing for Telegram display
 */
export function formatListingForTelegram(listing: {
  kawasan?: string | null;
  alamat?: string | null;
  lt?: number | null;
  lb?: number | null;
  kt?: number | null;
  km?: number | null;
  hadap?: string | null;
  lantai?: number | null;
  sertifikat?: string | null;
  furnished?: string | null;
  harga?: number | null;
  harga_text?: string | null;
  keterangan?: string | null;
  agent_name?: string;
  status?: string;
}): string {
  const lines: string[] = [];
  lines.push(`🏠 <b>${listing.kawasan || "N/A"}</b>`);
  if (listing.alamat) lines.push(`📍 ${listing.alamat}`);
  if (listing.lt || listing.lb) {
    lines.push(`📐 LT: ${listing.lt || "-"} m² | LB: ${listing.lb || "-"} m²`);
  }
  if (listing.kt || listing.km) {
    lines.push(`🛏️ KT: ${listing.kt || "-"} | 🚿 KM: ${listing.km || "-"}`);
  }
  if (listing.lantai) lines.push(`🏢 Lantai: ${listing.lantai}`);
  if (listing.hadap) lines.push(`🧭 Hadap: ${listing.hadap}`);
  if (listing.sertifikat) lines.push(`📜 Sertifikat: ${listing.sertifikat}`);
  if (listing.furnished) lines.push(`🪑 ${listing.furnished}`);
  if (listing.harga_text) {
    lines.push(`💰 ${listing.harga_text}`);
  } else if (listing.harga) {
    lines.push(`💰 Rp ${listing.harga.toLocaleString("id-ID")}`);
  }
  if (listing.keterangan) lines.push(`📝 ${listing.keterangan}`);
  if (listing.agent_name) lines.push(`👤 Agent: ${listing.agent_name}`);
  if (listing.status && listing.status !== "active") {
    lines.push(`⚠️ Status: ${listing.status.toUpperCase()}`);
  }

  return lines.join("\n");
}
