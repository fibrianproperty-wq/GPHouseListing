import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/cron/cleanup-sold
// This endpoint is meant to be called by a CRON job (e.g. Vercel Cron or cron-job.org)
export async function GET(request: Request) {
  try {
    // We use the service role key to bypass RLS since this is a system-level background job
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate the date 14 days ago
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Delete listings where status is 'sold' and updated_at is older than 14 days ago
    const { data, error } = await supabase
      .from("listings")
      .delete()
      .eq("status", "sold")
      .lt("updated_at", fourteenDaysAgo.toISOString())
      .select();

    if (error) {
      console.error("Cron cleanup error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${data?.length || 0} old sold listings`,
      deletedCount: data?.length || 0
    });
  } catch (error: any) {
    console.error("Cron GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
