import { GoogleGenAI } from "@google/genai";
import type { GeminiParsedListing, GeminiSearchParams, BotIntent } from "@/types/listing";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

/**
 * Detect user intent from a Telegram message
 */
export async function detectIntent(message: string): Promise<BotIntent> {
  // Quick pattern matching for commands
  if (message.startsWith("/start")) return "start";
  if (message.startsWith("/help")) return "help";

  // Check for template-like patterns (multiple fields with labels)
  const templatePatterns = [
    /kawasan|cluster/i,
    /alamat/i,
    /\blt\b.*\d|luas\s*tanah/i,
    /\blb\b.*\d|luas\s*bangunan/i,
    /\bkt\b.*\d|kamar\s*tidur/i,
    /\bkm\b.*\d|kamar\s*mandi/i,
    /harga/i,
  ];

  const matchCount = templatePatterns.filter((p) => p.test(message)).length;

  // If 3+ fields match, it's likely a template paste
  if (matchCount >= 3) return "template_parse";

  // Otherwise, use AI for intent classification
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Kamu adalah classifier intent untuk bot pencarian properti/rumah di Indonesia.

Klasifikasikan pesan berikut ke salah satu intent:
- "search" = user ingin mencari/bertanya tentang stok properti
- "template_parse" = user menempelkan data listing properti untuk disimpan
- "help" = user butuh bantuan / tidak jelas

Pesan: "${message}"

Jawab HANYA dengan satu kata: search, template_parse, atau help`,
  });

  const intent = response.text?.trim().toLowerCase();
  if (intent === "search" || intent === "template_parse" || intent === "help") {
    return intent as BotIntent;
  }
  return "search"; // default to search
}

/**
 * Parse a natural language search query into structured search parameters
 */
export async function parseSearchQuery(
  message: string
): Promise<GeminiSearchParams> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Kamu adalah parser pencarian properti Indonesia. Ekstrak parameter pencarian dari pesan berikut.

Pesan: "${message}"

Kembalikan HANYA JSON object (tanpa markdown code block) dengan format:
{
  "kawasan": "nama kawasan/cluster atau null",
  "harga_min": angka_rupiah_atau_null,
  "harga_max": angka_rupiah_atau_null,
  "kt_min": angka_atau_null,
  "km_min": angka_atau_null,
  "keyword": "keyword_pencarian_lain_atau_null"
}

Contoh konversi harga:
- "1 M" atau "1 Miliar" = 1000000000
- "850 juta" atau "850jt" = 850000000
- "di bawah 1 M" = harga_max: 1000000000
- "800jt-an" = harga_min: 750000000, harga_max: 850000000
- "kisaran 500-700 juta" = harga_min: 500000000, harga_max: 700000000

Kembalikan HANYA JSON, tanpa penjelasan.`,
  });

  try {
    const text = response.text?.trim() || "{}";
    // Remove markdown code fences if present
    const jsonStr = text.replace(/```(?:json)?\n?/g, "").replace(/\n?```/g, "").trim();
    return JSON.parse(jsonStr) as GeminiSearchParams;
  } catch {
    console.error("Failed to parse search query:", response.text);
    return {
      kawasan: null,
      harga_min: null,
      harga_max: null,
      kt_min: null,
      km_min: null,
      keyword: message,
    };
  }
}

/**
 * Parse a copy-pasted property listing template into structured data
 */
export async function parseListingTemplate(
  message: string
): Promise<GeminiParsedListing | null> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Kamu adalah parser template listing properti Indonesia. Ekstrak data dari template/teks berikut.

Teks:
"""
${message}
"""

Kembalikan HANYA JSON object (tanpa markdown code block) dengan format:
{
  "kawasan": "nama kawasan/cluster",
  "alamat": "alamat lengkap",
  "lt": angka_luas_tanah_m2_atau_null,
  "lb": angka_luas_bangunan_m2_atau_null,
  "kt": angka_kamar_tidur_atau_null,
  "km": angka_kamar_mandi_atau_null,
  "harga": angka_harga_rupiah,
  "harga_text": "teks harga asli dari template",
  "keterangan": "keterangan/catatan tambahan",
  "agent_name": "nama agent jika ada, atau string kosong"
}

Aturan konversi harga:
- "850 Juta" → harga: 850000000, harga_text: "850 Juta"
- "1.2 M (Nego)" → harga: 1200000000, harga_text: "1.2 M (Nego)"
- "Rp 850.000.000" → harga: 850000000

Jika ada field yang tidak ditemukan, isi dengan null (angka) atau string kosong.
Kembalikan HANYA JSON, tanpa penjelasan.`,
  });

  try {
    const text = response.text?.trim() || "";
    const jsonStr = text.replace(/```(?:json)?\n?/g, "").replace(/\n?```/g, "").trim();
    return JSON.parse(jsonStr) as GeminiParsedListing;
  } catch {
    console.error("Failed to parse listing template:", response.text);
    return null;
  }
}
