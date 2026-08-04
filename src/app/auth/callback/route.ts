import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

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
      console.error("[AUTH CALLBACK] exchangeCodeForSession error:", authError);
      return NextResponse.redirect(`${errorRedirect}auth_failed`);
    }

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      console.error("[AUTH CALLBACK] No email found for user:", user?.id);
      return NextResponse.redirect(`${errorRedirect}no_email`);
    }

    console.log("[AUTH CALLBACK] User email:", user.email);

    // Check if user is in the allowed_users whitelist using admin client to bypass RLS
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: allowedUser, error: allowedError } = await adminSupabase
      .from("allowed_users")
      .select("id, email, role")
      .eq("email", user.email)
      .single();

    console.log("[AUTH CALLBACK] Allowed user query result:", JSON.stringify({ allowedUser, allowedError }));

    if (allowedError || !allowedUser) {
      console.error("[AUTH CALLBACK] User NOT allowed. Error:", allowedError, "Data:", allowedUser);
      await supabase.auth.signOut();
      return NextResponse.redirect(`${errorRedirect}not_allowed`);
    }

    console.log("[AUTH CALLBACK] User ALLOWED, redirecting to dashboard");

    // Build redirect URL
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    let redirectUrl: string;

    if (isLocalEnv) {
      redirectUrl = `${origin}${next}`;
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${next}`;
    } else {
      redirectUrl = `${origin}${next}`;
    }

    // Create redirect response and forward all cookies so the session persists
    const response = NextResponse.redirect(redirectUrl);
    const cookieStore = await cookies();
    for (const cookie of cookieStore.getAll()) {
      response.cookies.set(cookie.name, cookie.value, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });
    }

    return response;
  }

  // No code provided
  return NextResponse.redirect(`${errorRedirect}no_code`);
}

