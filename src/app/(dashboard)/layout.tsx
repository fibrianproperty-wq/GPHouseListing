import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayoutClient } from "@/components/layout/DashboardLayoutClient";

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
  const { data: allowedUser } = await supabase
    .from("allowed_users")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!allowedUser) {
    redirect("/login?error=not_allowed");
  }

  return (
    <DashboardLayoutClient userEmail={user.email || ""}>
      {children}
    </DashboardLayoutClient>
  );
}
