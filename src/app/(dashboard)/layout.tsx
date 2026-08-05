import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayoutClient } from "@/components/layout/DashboardLayoutClient";
import { checkAllowedUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify user is in allowed list
  const allowedUser = await checkAllowedUser(user.email);

  if (!allowedUser) {
    redirect("/login?error=not_allowed");
  }

  return (
    <DashboardLayoutClient userEmail={user.email || ""}>
      {children}
    </DashboardLayoutClient>
  );
}
