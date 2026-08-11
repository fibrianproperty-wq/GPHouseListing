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
export async function detectIntent(message: string, messagesHistory: any[] = []): Promise<BotIntent | "template_parse_incomplete"> {
  // Check if we are in the middle of a template_parse form
  const lastAiMessage = [...messagesHistory].reverse().find(m => m.role === "ai");
  if (lastAiMessage && lastAiMessage.intent === "template_parse_incomplete") {
    return "template_parse_incomplete";
  }
  // Quick pattern matching for commands
  if (message.startsWith("/start")) return "start";
  if (message.startsWith("/help")) return "help";

  // Check for explicit WTS/WTB/WTR acronyms
  if (/^\s*(wts|dijual|disewa(?:kan)?)\b/i.test(message)) return "template_parse";
  if (/^\s*(wtb|wtr|dicari)\b/i.test(message)) return "search";

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
- "search" = user ingin mencari rumah (ciri-ciri: pakai kata WTB, WTR, DICARI, atau kalimat tanya).
- "template_parse" = user ingin menginput/memasukkan data listing baru ke database (ciri-ciri: pakai kata WTS, DIJUAL, DISEWA, DISEWAKAN, atau mem-paste spesifikasi detail rumah).
- "help" = user butuh bantuan / panduan cara pakai.
- "chat" = obrolan santai, basa-basi, atau pertanyaan umum di luar konteks properti (misal: "Halo", "Kamu siapa?").

Pesan: "${message}"

Jawab HANYA dengan satu kata: search, template_parse, help, atau chat`
  );

  const intent = text.trim().toLowerCase();
  if (intent === "search" || intent === "template_parse" || intent === "help" || intent === "chat") {
    return intent as BotIntent;
  }
  return "search"; // default to search
}

/**
 * Generate a conversational response based on context
 */
export async function generateConversationalResponse(
  message: string,
  intent: string,
  context?: any
): Promise<string> {
  let systemPrompt = "Kamu adalah HOMIS (Home Assistant) yang ramah, asisten properti cerdas yang membantu agen. Gunakan gaya bahasa asisten AI yang sopan.";
  
  if (intent === "search") {
    systemPrompt += `
Tugasmu merespons hasil pencarian properti.
Pesan user: "${message}"
Jumlah properti yang ditemukan dari database: ${context?.count || 0}.

Jika jumlah > 0: Berikan respons gembira bahwa kamu menemukan propertinya. Beritahu jumlahnya. Jangan berikan detail spesifikasi (karena akan ditampilkan otomatis dalam bentuk card). Cukup antarkan dengan ramah.
Jika jumlah = 0: Minta maaf dengan ramah bahwa kriteria yang dicari belum tersedia, dan tawarkan untuk mencoba kata kunci lain.
Jawablah dengan singkat, hangat, dan berbahasa Indonesia yang kasual namun sopan.`;
  } else if (intent === "chat") {
    systemPrompt += `
User mengajak ngobrol santai atau bertanya di luar properti. 
Pesan user: "${message}"

Berikan respons layaknya asisten virtual yang ramah, lucu, dan cerdas. Ingatkan dengan halus bahwa keahlian utamamu adalah membantu mencari dan mengelola listing properti jika percakapan terlalu jauh.`;
  } else if (intent === "help") {
    systemPrompt += `
User kebingungan atau meminta bantuan.
Pesan user: "${message}"

Jelaskan dengan ramah bahwa kamu bisa:
1. Membantu mencari properti (contoh: "Cari rumah 3 kamar di BSD harga di bawah 2M").
2. Membantu memasukkan data listing baru otomatis hanya dengan mem-paste teks spesifikasi rumah.`;
  }

  try {
    const text = await callGroq(systemPrompt);
    return text.trim();
  } catch (error) {
    console.error("Failed to generate conversational response:", error);
    return "Tentu, mari kita lihat hasilnya.";
  }
}

/**
 * Parse a natural language search query into structured search parameters
 */
export async function parseSearchQuery(
  message: string
): Promise<SearchParams> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: `Kamu adalah asisten pencarian properti cerdas di Indonesia. Ekstrak parameter dari pesan user.
PENTING: "M" = Milyar (×1.000.000.000), "jt" = Juta (×1.000.000).

Contoh 1:
User: "Cari rumah di BSD 4M"
Parameter: harga_min: 3500000000, harga_max: 4500000000, kawasan: "BSD", jenis_properti: "Rumah"

Contoh 2:
User: "LT 100 harga di bawah 1 M"
Parameter: lt_min: 100, harga_max: 1000000000, harga_min: null

Contoh 3:
User: "800jt-an di Bintaro 3 kamar"
Parameter: harga_min: 750000000, harga_max: 850000000, kawasan: "Bintaro", kt_min: 3

Contoh 4 (Rentang angka gaul):
User: "Mau cari ruko 2Man"
Parameter: harga_min: 2000000000, harga_max: 2999999999, jenis_properti: "Ruko"`
          },
          { role: "user", content: message }
        ],
        temperature: 0.1,
        tools: [
          {
            type: "function",
            function: {
              name: "extract_search_params",
              description: "Extract structured property search parameters from user message.",
              parameters: {
                type: "object",
                properties: {
                  kawasan: { type: "string", description: "Nama kawasan, lokasi, atau cluster (contoh: BSD, Bintaro). Null jika tidak ada." },
                  harga_min: { type: "number", description: "Harga minimum dalam Rupiah (angka penuh). Null jika tidak ada." },
                  harga_max: { type: "number", description: "Harga maksimum dalam Rupiah (angka penuh). Null jika tidak ada." },
                  kt_min: { type: "number", description: "Minimal jumlah kamar tidur. Null jika tidak ada." },
                  km_min: { type: "number", description: "Minimal jumlah kamar mandi. Null jika tidak ada." },
                  hadap: { type: "string", description: "Arah hadap (Utara/Selatan/Timur/Barat). Null jika tidak ada." },
                  lt_min: { type: "number", description: "Minimal luas tanah (m2). Null jika tidak ada." },
                  lb_min: { type: "number", description: "Minimal luas bangunan (m2). Null jika tidak ada." },
                  jenis_properti: { type: "string", description: "Jenis properti (Rumah, Ruko, Gudang, Tanah, dll). Null jika tidak disebutkan spesifik." },
                  keyword: { type: "string", description: "Kata kunci lain selain parameter di atas. Jangan masukkan angka harga/ukuran di sini. Null jika tidak ada." }
                }
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_search_params" } }
      }),
    });

    if (!response.ok) throw new Error("Groq API Error");

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (toolCall && toolCall.function.name === "extract_search_params") {
      const args = JSON.parse(toolCall.function.arguments);
      return {
        kawasan: args.kawasan || null,
        harga_min: args.harga_min || null,
        harga_max: args.harga_max || null,
        kt_min: args.kt_min || null,
        km_min: args.km_min || null,
        hadap: args.hadap || null,
        lt_min: args.lt_min || null,
        lb_min: args.lb_min || null,
        jenis_properti: args.jenis_properti || null,
        keyword: args.keyword || null,
      } as SearchParams;
    }
    
    throw new Error("No tool call returned");
  } catch (error) {
    console.error("Failed to parse search query:", error);
    return {
      kawasan: null, harga_min: null, harga_max: null, kt_min: null, km_min: null, 
      hadap: null, lt_min: null, lb_min: null, jenis_properti: null, keyword: message,
    };
  }
}

/**
 * Parse a copy-pasted property listing template into structured data
 */
export async function parseListingTemplate(
  message: string,
  previousData: Partial<ParsedListing> | null = null
): Promise<ParsedListing | null> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const systemPrompt = `Kamu adalah data extractor untuk properti Indonesia.
${previousData ? `PERHATIAN: Gabungkan data baru ini dengan data sebelumnya.\nData Sebelumnya:\n${JSON.stringify(previousData)}\n` : ''}
Aturan konversi:
- M = Milyar = 1.000.000.000, Jt = Juta = 1.000.000
- Jika disebutkan "kamar mandi setiap lantai", asumsikan jumlah kamar mandi sama dengan jumlah lantai (jika lantai disebutkan).
- Jika spesifikasi mencantumkan angka 0 (misalnya 0 Kamar Tidur), maka isi dengan angka 0. Jangan dikosongkan.
- Jika jenis properti adalah Apartemen atau Apartment, maka ukuran "Luas" yang disebutkan adalah Luas Bangunan (lb). Kosongkan Luas Tanah (lt).

Contoh 1:
Teks: "Dijual Rumah di BSD. LT 100 / LB 80. KT 3+1 KM 2. Harga 1.5 M Nego. SHM. Hub: Budi 08123"
Parameter: kawasan: "BSD", lt: 100, lb: 80, kt: 3, km: 2, harga: 1500000000, harga_text: "1.5 M Nego", sertifikat: "SHM", jenis_properti: "Rumah", tipe_transaksi: "Jual", agent_name: "Budi"

Contoh 2:
Teks: "Disewakan Ruko Gading Serpong 800 Juta/tahun. Kosong. Contact Mawar."
Parameter: kawasan: "Gading Serpong", harga: 800000000, harga_text: "800 Juta/tahun", furnished: "Unfurnished", jenis_properti: "Ruko", tipe_transaksi: "Sewa", agent_name: "Mawar"`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Teks:\n"""\n${message}\n"""` }
        ],
        temperature: 0.1,
        tools: [
          {
            type: "function",
            function: {
              name: "extract_listing_data",
              description: "Extract structured property listing data from text",
              parameters: {
                type: "object",
                properties: {
                  kawasan: { type: "string" },
                  alamat: { type: "string" },
                  lt: { type: "number" },
                  lb: { type: "number" },
                  kt: { type: "number" },
                  km: { type: "number" },
                  hadap: { type: "string" },
                  lantai: { type: "number" },
                  sertifikat: { type: "string" },
                  furnished: { type: "string" },
                  harga: { type: "number", description: "Harga absolut dalam bentuk angka integer Rupiah (contoh: 1500000000)" },
                  harga_text: { type: "string", description: "Teks harga asli (contoh: '1.5 M Nego')" },
                  keterangan: { type: "string" },
                  photo_link: { type: "string" },
                  kondisi: { type: "string" },
                  jenis_properti: { type: "string" },
                  ketersediaan: { type: "string" },
                  tipe_transaksi: { type: "string" },
                  agent_name: { type: "string", description: "Nama agen/kontak (biasanya diawali 'Hubungi', 'Contact', 'Info:'). Ambil HANYA namanya saja tanpa nomor telepon." }
                }
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_listing_data" } }
      }),
    });

    if (!response.ok) throw new Error("Groq API Error");

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];

    if (toolCall && toolCall.function.name === "extract_listing_data") {
      const args = JSON.parse(toolCall.function.arguments);
      
      return {
        kawasan: args.kawasan || "",
        alamat: args.alamat || "",
        lt: args.lt ?? null,
        lb: args.lb ?? null,
        kt: args.kt ?? null,
        km: args.km ?? null,
        hadap: args.hadap || "",
        lantai: args.lantai ?? null,
        sertifikat: args.sertifikat || "",
        furnished: args.furnished || "",
        harga: args.harga ?? 0,
        harga_text: args.harga_text || "",
        keterangan: args.keterangan || "",
        photo_link: args.photo_link || "",
        kondisi: args.kondisi || "N/A",
        jenis_properti: args.jenis_properti || "Rumah",
        ketersediaan: args.ketersediaan || "N/A",
        tipe_transaksi: args.tipe_transaksi || "Jual",
        agent_name: args.agent_name || ""
      } as ParsedListing;
    }
    
    throw new Error("No tool call returned");
  } catch (error) {
    console.error("Failed to parse listing template:", error);
    return null;
  }
}
