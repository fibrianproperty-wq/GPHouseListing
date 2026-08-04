import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorRedirect = `${origin}/login?error=`;

  if (!code) {
    return NextResponse.redirect(`${errorRedirect}no_code`);
  }

  const cookieStore = await cookies();

  // Track cookies that Supabase sets during exchangeCodeForSession
  const cookiesToForward: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // ignore
            }
            cookiesToForward.push({ name, value, options });
          });
        },
      },
    }
  );

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
  console.log("[AUTH CALLBACK] Cookies to forward:", cookiesToForward.length);

  // TODO: Re-enable whitelist check after confirming login works
  // For now, allow all authenticated Google users through

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

  // Create redirect response and forward all session cookies
  const response = NextResponse.redirect(redirectUrl);
  cookiesToForward.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  console.log("[AUTH CALLBACK] Redirecting to:", redirectUrl);
  return response;
}
