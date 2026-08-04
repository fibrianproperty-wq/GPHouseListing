import type { ParsedListing, SearchParams, BotIntent } from "@/types/listing";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Helper: call Groq chat completions API
 */
async function callGroq(
  prompt: string,
  options?: { jsonMode?: boolean }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY belum di-set di environment variables.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      ...(options?.jsonMode && { response_format: { type: "json_object" } }),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Groq API error:", errorData);
    throw new Error(`Groq API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

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
  const text = await callGroq(
    `Kamu adalah classifier intent untuk bot pencarian properti/rumah di Indonesia.

Klasifikasikan pesan berikut ke salah satu intent:
- "search" = user ingin mencari/bertanya tentang stok properti
- "template_parse" = user menempelkan data listing properti untuk disimpan
- "help" = user butuh bantuan / tidak jelas

Pesan: "${message}"

Jawab HANYA dengan satu kata: search, template_parse, atau help`
  );

  const intent = text.trim().toLowerCase();
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
): Promise<SearchParams> {
  try {
    const text = await callGroq(
      `Kamu adalah parser pencarian properti Indonesia. Ekstrak parameter pencarian dari pesan berikut.

Pesan: "${message}"

Kembalikan HANYA JSON object (tanpa markdown code block) dengan format:
{
  "kawasan": "nama kawasan/cluster atau null",
  "harga_min": angka_rupiah_atau_null,
  "harga_max": angka_rupiah_atau_null,
  "kt_min": angka_atau_null,
  "km_min": angka_atau_null,
  "hadap": "arah hadap rumah (Utara/Selatan/Timur/Barat/dll) atau null",
  "lt_min": angka_luas_tanah_m2_atau_null,
  "lb_min": angka_luas_bangunan_m2_atau_null,
  "keyword": "keyword_pencarian_lain_atau_null"
}

Contoh konversi harga (PENTING: "M" = Milyar = ×1.000.000.000, ada 9 nol):
- "1 M" atau "1 Miliar" = 1000000000
- "4M" = 4000000000
- "850 juta" atau "850jt" = 850000000
- "di bawah 1 M" = harga_max: 1000000000
- "800jt-an" = harga_min: 750000000, harga_max: 850000000
- "kisaran 500-700 juta" = harga_min: 500000000, harga_max: 700000000

Kembalikan HANYA JSON, tanpa penjelasan.`,
      { jsonMode: true }
    );

    const jsonStr = text
      .trim()
      .replace(/```(?:json)?\n?/g, "")
      .replace(/\n?```/g, "")
      .trim();
    return JSON.parse(jsonStr) as SearchParams;
  } catch (error) {
    console.error("Failed to parse search query:", error);
    return {
      kawasan: null,
      harga_min: null,
      harga_max: null,
      kt_min: null,
      km_min: null,
      hadap: null,
      lt_min: null,
      lb_min: null,
      keyword: message,
    };
  }
}

/**
 * Parse a copy-pasted property listing template into structured data
 */
export async function parseListingTemplate(
  message: string
): Promise<ParsedListing | null> {
  try {
    const text = await callGroq(
      `Kamu adalah parser template listing properti Indonesia. Ekstrak data dari template/teks berikut.

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
  "hadap": "arah hadap rumah (Utara/Selatan/Timur/Barat/dll) atau string kosong",
  "lantai": angka_jumlah_lantai_atau_null,
  "sertifikat": "jenis sertifikat (SHM/SHGB/AJB/Strata Title/dll) atau string kosong",
  "furnished": "status furnished (Furnished/Semi-Furnished/Unfurnished) atau string kosong",
  "harga": angka_harga_rupiah,
  "harga_text": "teks harga asli dari template",
  "keterangan": "keterangan/catatan tambahan (carport, kitchen set, dll)",
  "agent_name": "nama agent jika ada, atau string kosong"
}

Aturan konversi harga (PENTING: "M" = Milyar = ×1.000.000.000, ada 9 nol):
- "850 Juta" → harga: 850000000, harga_text: "850 Juta"
- "1.2 M (Nego)" → harga: 1200000000, harga_text: "1.2 M (Nego)"
- "4M NEGO" → harga: 4000000000, harga_text: "4M NEGO"
- "Rp 850.000.000" → harga: 850000000

Jika ada field yang tidak ditemukan, isi dengan null (angka) atau string kosong.
Kembalikan HANYA JSON, tanpa penjelasan.`,
      { jsonMode: true }
    );

    const jsonStr = text
      .trim()
      .replace(/```(?:json)?\n?/g, "")
      .replace(/\n?```/g, "")
      .trim();
    return JSON.parse(jsonStr) as ParsedListing;
  } catch (error) {
    console.error("Failed to parse listing template:", error);
    return null;
  }
}
