import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMessage, sendMessageWithKeyboard, answerCallbackQuery, formatListingForTelegram } from "@/lib/telegram";
import { detectIntent, parseSearchQuery, parseListingTemplate } from "@/lib/groq";
import type { TelegramUpdate } from "@/types/listing";

// Create a service role client that bypasses RLS (for bot operations)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// In-memory store for pending listings (simple approach for serverless)
// In production, consider using a database table for this
const pendingListings = new Map<string, Record<string, unknown>>();

export async function POST(request: Request) {
  try {
    // 1. Verify webhook secret
    const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
    if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update: TelegramUpdate = await request.json();

    // Handle callback queries (button presses)
    if (update.callback_query) {
      await handleCallbackQuery(update);
      return NextResponse.json({ ok: true });
    }

    // Handle text messages
    if (update.message?.text) {
      await handleMessage(update);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function handleMessage(update: TelegramUpdate) {
  const message = update.message!;
  const chatId = message.chat.id;
  const text = message.text!;
  const userId = message.from.id.toString();

  // 2. Check Telegram whitelist
  const supabase = createServiceClient();
  const { data: allowed } = await supabase
    .from("allowed_telegram_users")
    .select("telegram_user_id, name")
    .eq("telegram_user_id", userId)
    .single();

  if (!allowed) {
    await sendMessage(
      chatId,
      "⛔ <b>Akses Ditolak</b>\n\nTelegram ID Anda belum terdaftar. Hubungi admin untuk mendapatkan akses.\n\nYour Telegram ID: <code>" +
        userId +
        "</code>"
    );
    return;
  }

  // 3. Detect intent
  const intent = await detectIntent(text);

  switch (intent) {
    case "start":
      await handleStart(chatId, allowed.name || message.from.first_name);
      break;
    case "help":
      await handleHelp(chatId);
      break;
    case "search":
      await handleSearch(chatId, text);
      break;
    case "template_parse":
      await handleTemplateParse(chatId, text, userId);
      break;
    default:
      await handleHelp(chatId);
  }
}

async function handleStart(chatId: number, name: string) {
  await sendMessage(
    chatId,
    `👋 <b>Halo, ${name}!</b>\n\nSelamat datang di <b>Property Hub Bot</b> 🏠\n\nSaya bisa membantu Anda:\n\n🔍 <b>Cari Listing</b>\nKetik langsung apa yang dicari:\n<i>"Cari rumah di Gading Serpong harga di bawah 1 M"</i>\n<i>"Ada stok di Bintaro 3 KT?"</i>\n\n📋 <b>Input Listing Baru</b>\nPaste template listing dari WhatsApp/owner, saya akan otomatis parsing data-nya!\n\n📝 <b>Contoh template:</b>\n<pre>DIJUAL RUMAH\nKawasan: Gading Serpong\nAlamat: Jl. Mawar No. 12\nLT: 90 m2\nLB: 60 m2\nKT: 3\nKM: 2\nHarga: 850 Juta (Nego)\nKet: Siap huni, SHM</pre>\n\nKetik /help untuk bantuan lebih lanjut.`
  );
}

async function handleHelp(chatId: number) {
  await sendMessage(
    chatId,
    `📖 <b>Panduan Property Hub Bot</b>\n\n<b>🔍 Pencarian Stok:</b>\nKetik langsung pertanyaan Anda:\n• <i>"Rumah di Gading Serpong"</i>\n• <i>"Harga di bawah 1 M minimal 3 KT"</i>\n• <i>"Stok kawasan BSD 800jt-an"</i>\n• <i>"Ada 2 lantai di Alam Sutera?"</i>\n\n<b>📋 Input Listing Baru:</b>\nPaste template listing. Saya akan parsing otomatis dan minta konfirmasi sebelum menyimpan.\n\n<b>Format yang didukung:</b>\n• Template agen standar (Kawasan, Alamat, LT/LB, KT/KM, Harga)\n• Format bebas — AI akan mencoba memahami\n\n<b>⌨️ Commands:</b>\n/start - Mulai & sambutan\n/help - Panduan ini`
  );
}

async function handleSearch(chatId: number, text: string) {
  await sendMessage(chatId, "🔍 Sedang mencari...");

  try {
    // Parse search query using AI
    const searchParams = await parseSearchQuery(text);

    // Build Supabase query
    const supabase = createServiceClient();
    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);

    if (searchParams.kawasan) {
      const k = searchParams.kawasan.toLowerCase();
      if (k.includes("serpong")) {
        query = query.or(`kawasan.ilike.%serpong%,kawasan.ilike.%bsd%,kawasan.ilike.%gs%,kawasan.ilike.%gading serpong%,judul.ilike.%serpong%,judul.ilike.%bsd%,judul.ilike.%gs%,judul.ilike.%gading serpong%,alamat.ilike.%serpong%,alamat.ilike.%bsd%,alamat.ilike.%gs%,alamat.ilike.%gading serpong%`);
      } else {
        query = query.or(`kawasan.ilike.%${searchParams.kawasan}%,judul.ilike.%${searchParams.kawasan}%,alamat.ilike.%${searchParams.kawasan}%`);
      }
    }
    if (searchParams.harga_min) {
      query = query.gte("harga", searchParams.harga_min);
    }
    if (searchParams.harga_max) {
      query = query.lte("harga", searchParams.harga_max);
    }
    if (searchParams.kt_min) {
      query = query.gte("kt", searchParams.kt_min);
    }
    if (searchParams.km_min) {
      query = query.gte("km", searchParams.km_min);
    }
    if (searchParams.jenis_properti) {
      query = query.ilike("jenis_properti", `%${searchParams.jenis_properti}%`);
    }
    if (searchParams.keyword) {
      const keywordLower = searchParams.keyword.toLowerCase();
      if (keywordLower.includes("serpong")) {
        query = query.or(`judul.ilike.%${searchParams.keyword}%,kawasan.ilike.%${searchParams.keyword}%,alamat.ilike.%${searchParams.keyword}%,keterangan.ilike.%${searchParams.keyword}%,jenis_properti.ilike.%${searchParams.keyword}%,kawasan.ilike.%bsd%,kawasan.ilike.%gs%,kawasan.ilike.%gading serpong%,judul.ilike.%bsd%,judul.ilike.%gs%,judul.ilike.%gading serpong%,alamat.ilike.%bsd%,alamat.ilike.%gs%,alamat.ilike.%gading serpong%,keterangan.ilike.%bsd%,keterangan.ilike.%gs%,keterangan.ilike.%gading serpong%`);
      } else {
        query = query.or(`judul.ilike.%${searchParams.keyword}%,kawasan.ilike.%${searchParams.keyword}%,alamat.ilike.%${searchParams.keyword}%,keterangan.ilike.%${searchParams.keyword}%,jenis_properti.ilike.%${searchParams.keyword}%`);
      }
    }

    const { data: listings, error } = await query;

    if (error) {
      await sendMessage(chatId, "❌ Terjadi kesalahan saat mencari. Coba lagi nanti.");
      return;
    }

    if (!listings || listings.length === 0) {
      let noResultMsg = "📭 <b>Tidak ada listing yang cocok.</b>\n\n";
      noResultMsg += "Parameter pencarian:\n";
      if (searchParams.kawasan) noResultMsg += `• Kawasan: ${searchParams.kawasan}\n`;
      if (searchParams.harga_min) noResultMsg += `• Harga min: Rp ${searchParams.harga_min.toLocaleString("id-ID")}\n`;
      if (searchParams.harga_max) noResultMsg += `• Harga max: Rp ${searchParams.harga_max.toLocaleString("id-ID")}\n`;
      if (searchParams.kt_min) noResultMsg += `• Min KT: ${searchParams.kt_min}\n`;
      if (searchParams.km_min) noResultMsg += `• Min KM: ${searchParams.km_min}\n`;
      if (searchParams.jenis_properti) noResultMsg += `• Jenis Properti: ${searchParams.jenis_properti}\n`;
      noResultMsg += "\nCoba perluas pencarian atau gunakan kata kunci berbeda.";
      await sendMessage(chatId, noResultMsg);
      return;
    }

    // Format results
    let resultMsg = `🏠 <b>Ditemukan ${listings.length} listing:</b>\n`;
    resultMsg += "━━━━━━━━━━━━━━━━━━\n\n";

    listings.forEach((listing, index) => {
      resultMsg += `<b>${index + 1}.</b> `;
      resultMsg += formatListingForTelegram(listing);
      resultMsg += "\n\n";
    });

    if (listings.length >= 5) {
      resultMsg += "ℹ️ <i>Menampilkan 5 hasil teratas. Buka dashboard untuk melihat lebih banyak.</i>";
    }

    await sendMessage(chatId, resultMsg);
  } catch (error) {
    console.error("Search error:", error);
    await sendMessage(chatId, "❌ Gagal memproses pencarian. Coba lagi.");
  }
}

async function handleTemplateParse(
  chatId: number,
  text: string,
  telegramUserId: string
) {
  await sendMessage(chatId, "📋 Sedang memproses template...");

  try {
    const parsed = await parseListingTemplate(text);

    if (!parsed) {
      await sendMessage(
        chatId,
        "❌ Gagal memproses template. Pastikan format template sudah benar.\n\nKetik /help untuk melihat format yang didukung."
      );
      return;
    }

    // Store pending listing data
    const pendingKey = `${chatId}_${Date.now()}`;
    pendingListings.set(pendingKey, {
      ...parsed,
      source: "telegram",
      telegram_user_id: telegramUserId,
    });

    // Clean up old pending listings (older than 10 min)
    const tenMinAgo = Date.now() - 10 * 60 * 1000;
    for (const [key] of pendingListings) {
      const timestamp = parseInt(key.split("_")[1]);
      if (timestamp < tenMinAgo) pendingListings.delete(key);
    }

    // Format confirmation message
    let confirmMsg = "📋 <b>Data Listing yang Terdeteksi:</b>\n";
    confirmMsg += "━━━━━━━━━━━━━━━━━━\n\n";
    confirmMsg += formatListingForTelegram(parsed);
    confirmMsg += "\n\n━━━━━━━━━━━━━━━━━━\n";
    confirmMsg += "Apakah data di atas sudah benar?";

    await sendMessageWithKeyboard(chatId, confirmMsg, [
      [
        { text: "✅ Simpan", callback_data: `save_${pendingKey}` },
        { text: "❌ Batal", callback_data: `cancel_${pendingKey}` },
      ],
    ]);
  } catch (error) {
    console.error("Template parse error:", error);
    await sendMessage(chatId, "❌ Gagal memproses template. Coba lagi.");
  }
}

async function handleCallbackQuery(update: TelegramUpdate) {
  const callbackQuery = update.callback_query!;
  const data = callbackQuery.data || "";
  const chatId = callbackQuery.message?.chat.id;

  if (!chatId) return;

  await answerCallbackQuery(callbackQuery.id);

  if (data.startsWith("save_")) {
    const pendingKey = data.replace("save_", "");
    const listingData = pendingListings.get(pendingKey);

    if (!listingData) {
      await sendMessage(chatId, "⏰ Data sudah expired. Silakan paste ulang template.");
      return;
    }

    // Check if agent_name is provided
    if (!listingData.agent_name) {
      await sendMessage(
        chatId,
        "⚠️ <b>Nama agent belum terisi!</b>\n\nBalas pesan ini dengan format:\n<code>agent: Nama Agent</code>\n\nContoh: <code>agent: Budi Santoso</code>"
      );
      // Keep the pending listing for now, but note: in serverless this is best-effort
      return;
    }

    // Save to database
    const supabase = createServiceClient();
    const { error } = await supabase.from("listings").insert(listingData);

    if (error) {
      console.error("Save listing error:", error);
      await sendMessage(chatId, "❌ Gagal menyimpan listing. Error: " + error.message);
    } else {
      await sendMessage(
        chatId,
        "✅ <b>Listing berhasil disimpan!</b>\n\nData sudah tersedia di dashboard web."
      );
    }

    pendingListings.delete(pendingKey);
  } else if (data.startsWith("cancel_")) {
    const pendingKey = data.replace("cancel_", "");
    pendingListings.delete(pendingKey);
    await sendMessage(chatId, "❌ Input listing dibatalkan.");
  }
}
