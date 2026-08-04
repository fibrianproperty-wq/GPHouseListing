"use server";

import type { ParsedListing } from "@/types/listing";

export async function parseListingWithGroq(
  text: string
): Promise<{ success: boolean; data?: ParsedListing; error?: string }> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return { success: false, error: "GROQ_API_KEY belum di-set di environment variables." };
    }

    const systemPrompt = `Kamu adalah AI cerdas untuk mem-parsing data properti/rumah di Indonesia.
Ekstrak data dari teks mentah yang diberikan ke dalam format JSON yang ketat.

Teks:
"""
${text}
"""

Kembalikan HANYA JSON object (tanpa markdown code block, tanpa penjelasan apa pun) dengan format persis seperti ini:
{
  "kawasan": "nama kawasan/cluster atau string kosong",
  "alamat": "alamat lengkap atau string kosong",
  "lt": angka_luas_tanah_m2_atau_null,
  "lb": angka_luas_bangunan_m2_atau_null,
  "kt": angka_kamar_tidur_atau_null,
  "km": angka_kamar_mandi_atau_null,
  "hadap": "arah hadap rumah (Utara/Selatan/Timur/Barat/dll) atau string kosong",
  "lantai": angka_jumlah_lantai_atau_null,
  "sertifikat": "jenis sertifikat (SHM/SHGB/AJB/Strata Title/dll) atau string kosong",
  "furnished": "status furnished (Furnished/Semi-Furnished/Unfurnished) atau string kosong",
  "harga": angka_harga_rupiah_atau_null,
  "harga_text": "teks harga asli dari teks (misal: 850 Juta Nego) atau string kosong",
  "keterangan": "keterangan/catatan tambahan (carport, kitchen set, dll) atau string kosong",
  "agent_name": "nama agent jika ada, atau string kosong"
}

Aturan konversi harga (PENTING: "M" = Milyar = ×1.000.000.000, ada 9 nol):
- "850 Juta" → harga: 850000000, harga_text: "850 Juta"
- "1.2 M (Nego)" → harga: 1200000000, harga_text: "1.2 M (Nego)"
- "4M NEGO" → harga: 4000000000, harga_text: "4M NEGO"
- "Rp 850.000.000" → harga: 850000000, harga_text: "Rp 850.000.000"

Jika ada field angka (lt, lb, kt, km, lantai, harga) yang tidak ditemukan, isi dengan null.
Kembalikan HANYA JSON.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: systemPrompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API error:", errorData);
      return { success: false, error: "Gagal terhubung ke AI (Groq API Error)." };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "{}";
    
    // Kadang model mengembalikan markdown code block meskipun dilarang
    const cleanContent = content.replace(/```(?:json)?\n?/g, "").replace(/\n?```/g, "").trim();
    
    const parsedData = JSON.parse(cleanContent) as ParsedListing;
    return { success: true, data: parsedData };
  } catch (error: any) {
    console.error("Error parsing listing with Groq:", error);
    return { success: false, error: "Gagal memproses data. Coba ubah sedikit teks Anda." };
  }
}
