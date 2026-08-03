import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await adminSupabase
    .from('allowed_users')
    .select('*')
    .eq('email', email)
    .single();

  return NextResponse.json({ email, data, error, hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY });
}
