import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "@/lib/integrations/supabase/env";

/**
 * Server-side Supabase client that acts as the signed-in agent (session from cookies),
 * so every query goes through RLS. Must be called inside a request (Suspense / action / route).
 */
export async function createClient() {
  // The Supabase client reads the clock (Date.now) while it starts. Marking the render as
  // request-time first keeps Cache Components from flagging it during prerendering.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
