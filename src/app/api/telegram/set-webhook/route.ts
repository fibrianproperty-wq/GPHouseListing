import { NextResponse } from "next/server";
import { setWebhook } from "@/lib/telegram";

// GET /api/telegram/set-webhook — One-time webhook registration
export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!appUrl || !webhookSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing NEXT_PUBLIC_APP_URL or TELEGRAM_WEBHOOK_SECRET",
        },
        { status: 500 }
      );
    }

    const webhookUrl = `${appUrl}/api/telegram`;
    const result = await setWebhook(webhookUrl, webhookSecret);

    if (result) {
      return NextResponse.json({
        success: true,
        message: "Webhook set successfully",
        webhook_url: webhookUrl,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to set webhook. Check your bot token.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Set webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
