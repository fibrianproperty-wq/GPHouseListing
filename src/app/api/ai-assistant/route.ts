import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { detectIntent, parseSearchQuery, parseListingTemplate, generateConversationalResponse } from "@/lib/groq";

export async function POST(request: Request) {
  try {
    const { message, messages = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component context
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const intent = await detectIntent(message, messages);

    if (intent === "search") {
      const searchParams = await parseSearchQuery(message);
      
      let query = supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10); // Fetch up to 10 for web chat

      if (searchParams.kawasan) query = query.ilike("kawasan", `%${searchParams.kawasan}%`);
      if (searchParams.harga_min) query = query.gte("harga", searchParams.harga_min);
      if (searchParams.harga_max) query = query.lte("harga", searchParams.harga_max);
      if (searchParams.kt_min) query = query.gte("kt", searchParams.kt_min);
      if (searchParams.km_min) query = query.gte("km", searchParams.km_min);
      if (searchParams.keyword) {
        query = query.or(`kawasan.ilike.%${searchParams.keyword}%,alamat.ilike.%${searchParams.keyword}%,keterangan.ilike.%${searchParams.keyword}%`);
      }

      const { data: listings, error } = await query;
      if (error) throw error;

      const reply = await generateConversationalResponse(message, "search", { count: listings?.length || 0 });

      return NextResponse.json({
        intent: "search",
        searchParams,
        listings: listings || [],
        reply
      });
    }

    if (intent === "chat") {
      const reply = await generateConversationalResponse(message, "chat");
      return NextResponse.json({ intent: "chat", reply });
    }

    if (intent === "template_parse" || intent === "template_parse_incomplete") {
      const lastAiMessage = [...messages].reverse().find((m: any) => m.role === "ai");
      const previousParsedData = lastAiMessage?.parsedData || null;

      const parsedData = await parseListingTemplate(message, previousParsedData);
      
      if (!parsedData) {
        return NextResponse.json({
          intent: "error",
          reply: "Gagal memproses template. Pastikan format teks sudah benar."
        });
      }

      // Check required fields
      const isComplete = parsedData.kawasan && parsedData.harga && parsedData.lt && parsedData.kt;

      if (!isComplete) {
        const missing = [];
        if (!parsedData.kawasan) missing.push("Kawasan");
        if (!parsedData.harga) missing.push("Harga");
        if (!parsedData.lt) missing.push("Luas Tanah");
        if (!parsedData.kt) missing.push("Kamar Tidur");

        return NextResponse.json({
          intent: "template_parse_incomplete",
          parsedData,
          reply: `Tolong lengkapi informasi yang masih kosong: ${missing.join(", ")}.\nSemakin lengkap informasinya, semakin pintar saya mencari dan menyimpannya.`
        });
      }

      return NextResponse.json({
        intent: "template_parse",
        parsedData,
        reply: "Data sudah lengkap! Silakan konfirmasi untuk menyimpannya ke database:"
      });
    }

    if (intent === "help" || intent === "start") {
      return NextResponse.json({
        intent: "help",
        reply: "Halo! Saya adalah HOMIS (Home Assistant). Anda bisa mencari properti (misal: 'Cari rumah 3 KT di BSD di bawah 2 M') atau langsung mem-paste spesifikasi data rumah untuk saya simpan."
      });
    }

    return NextResponse.json({ intent: "unknown", reply: "Saya tidak yakin apa yang Anda maksud. Coba cari properti atau paste template listing." });
  } catch (error: any) {
    console.error("AI Assistant error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
