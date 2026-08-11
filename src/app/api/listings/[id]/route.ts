import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/listings/[id] — Fetch a single listing
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Listing GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/listings/[id] — Update a listing
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const updates: Record<string, unknown> = {};

    // Check ownership
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    if (user) {
      const { data: allowedUser } = await supabase
        .from("allowed_users")
        .select("role")
        .eq("email", user.email)
        .single();
      isAdmin = allowedUser?.role === "admin";
    }

    const { data: existingListing, error: fetchError } = await supabase
      .from("listings")
      .select("created_by")
      .eq("id", id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (!isAdmin && existingListing.created_by !== user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const allowedFields = [
      "kawasan",
      "alamat",
      "lt",
      "lb",
      "kt",
      "km",
      "harga",
      "harga_text",
      "keterangan",
      "photo_link",
      "kondisi",
      "jenis_properti",
      "ketersediaan",
      "tipe_transaksi",
      "agent_name",
      "status",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Convert number fields
    if (updates.lt !== undefined && updates.lt !== null) updates.lt = Number(updates.lt);
    if (updates.lb !== undefined && updates.lb !== null) updates.lb = Number(updates.lb);
    if (updates.kt !== undefined && updates.kt !== null) updates.kt = Math.round(Number(updates.kt));
    if (updates.km !== undefined && updates.km !== null) updates.km = Math.round(Number(updates.km));
    if (updates.harga !== undefined && updates.harga !== null) updates.harga = Math.round(Number(updates.harga));

    const { data, error } = await supabase
      .from("listings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Listing update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Listing PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/listings/[id] — Soft delete (set status to 'inactive')
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check ownership
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    if (user) {
      const { data: allowedUser } = await supabase
        .from("allowed_users")
        .select("role")
        .eq("email", user.email)
        .single();
      isAdmin = allowedUser?.role === "admin";
    }

    const { data: existingListing, error: fetchError } = await supabase
      .from("listings")
      .select("created_by")
      .eq("id", id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (!isAdmin && existingListing.created_by !== user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Listing delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, message: "Listing deleted permanently" });
  } catch (error) {
    console.error("Listing DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
