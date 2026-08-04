import { NextResponse } from "next/server";

const DEPLOY_VERSION = "v5-groq-migration";

export async function GET() {
  return NextResponse.json({
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
      hasGroqKey: !!process.env.GROQ_API_KEY,
      groqKeyPrefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 4) : null,
    },
  });
}
