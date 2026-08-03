import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AllowedUser } from "@/types/listing";

/**
 * Get the current authenticated user from Supabase
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if a user's email is in the allowed_users whitelist
 */
export async function checkAllowedUser(
  email: string
): Promise<AllowedUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("allowed_users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) return null;
  return data as AllowedUser;
}

/**
 * Get current user and verify they are allowed
 * Redirects to login if not authenticated or not allowed
 */
export async function requireAuth(): Promise<{
  userId: string;
  email: string;
  allowedUser: AllowedUser;
}> {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    redirect("/login");
  }

  const allowedUser = await checkAllowedUser(user.email);
  if (!allowedUser) {
    redirect("/login?error=not_allowed");
  }

  return {
    userId: user.id,
    email: user.email,
    allowedUser,
  };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
