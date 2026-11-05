import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/integrations/supabase/server";

export type AdminUser = { email: string };

/**
 * Guard for every /admin page and action (ARCHITECTURE §2.7, layer 1).
 * - No session → login screen.
 * - Signed in but not in admin_users → sign out + "no permission" message.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/admin/login");
  }

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  return { email: user.email };
}
