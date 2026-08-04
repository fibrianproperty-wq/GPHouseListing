import { NextResponse } from "next/server";
import { parseSearchQuery } from "@/lib/groq";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const searchParams = await parseSearchQuery(body.query);
    
    return NextResponse.json({ data: searchParams });
  } catch (error) {
    console.error("Smart search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
