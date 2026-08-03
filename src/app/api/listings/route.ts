import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ListingSearchParams } from "@/types/listing";

// GET /api/listings — Fetch listings with filters
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const params: ListingSearchParams = {
      kawasan: searchParams.get("kawasan") || undefined,
      harga_min: searchParams.get("harga_min")
        ? Number(searchParams.get("harga_min"))
        : undefined,
      harga_max: searchParams.get("harga_max")
        ? Number(searchParams.get("harga_max"))
        : undefined,
      kt_min: searchParams.get("kt_min")
        ? Number(searchParams.get("kt_min"))
        : undefined,
      km_min: searchParams.get("km_min")
        ? Number(searchParams.get("km_min"))
        : undefined,
      status: searchParams.get("status") || "active",
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    let query = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (params.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }
    if (params.kawasan) {
      query = query.ilike("kawasan", `%${params.kawasan}%`);
    }
    if (params.harga_min) {
      query = query.gte("harga", params.harga_min);
    }
    if (params.harga_max) {
      query = query.lte("harga", params.harga_max);
    }
    if (params.kt_min) {
      query = query.gte("kt", params.kt_min);
    }
    if (params.km_min) {
      query = query.gte("km", params.km_min);
    }
    if (params.search) {
      query = query.or(
        `kawasan.ilike.%${params.search}%,alamat.ilike.%${params.search}%,agent_name.ilike.%${params.search}%,keterangan.ilike.%${params.search}%`
      );
    }

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Listings fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Listings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/listings — Create a new listing
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.agent_name) {
      return NextResponse.json(
        { error: "Nama agent wajib diisi" },
        { status: 400 }
      );
    }

    const listing = {
      kawasan: body.kawasan || null,
      alamat: body.alamat || null,
      lt: body.lt ? Number(body.lt) : null,
      lb: body.lb ? Number(body.lb) : null,
      kt: body.kt ? Number(body.kt) : null,
      km: body.km ? Number(body.km) : null,
      harga: body.harga ? Number(body.harga) : null,
      harga_text: body.harga_text || null,
      keterangan: body.keterangan || null,
      agent_name: body.agent_name,
      status: body.status || "active",
      source: body.source || "web",
      telegram_user_id: body.telegram_user_id || null,
    };

    const { data, error } = await supabase
      .from("listings")
      .insert(listing)
      .select()
      .single();

    if (error) {
      console.error("Listing create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Listings POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
