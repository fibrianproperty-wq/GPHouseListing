import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorRedirect = `${origin}/login?error=`;

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.redirect(`${errorRedirect}auth_failed`);
    }

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.redirect(`${errorRedirect}no_email`);
    }

    // Check if user is in the allowed_users whitelist
    const { data: allowedUser } = await supabase
      .from("allowed_users")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!allowedUser) {
      // User is not allowed — sign them out and redirect with error
      await supabase.auth.signOut();
      return NextResponse.redirect(`${errorRedirect}not_allowed`);
    }

    // User is allowed — redirect to dashboard
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";

    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    } else {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code provided
  return NextResponse.redirect(`${errorRedirect}no_code`);
}
