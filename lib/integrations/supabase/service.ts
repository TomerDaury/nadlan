import "server-only";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/integrations/supabase/env";

/**
 * Server-only Supabase client with the secret key (bypasses RLS, no session).
 * Used only by the public client pages, which have no sign-in (ARCHITECTURE §2.7):
 * access to client data is allowed only after the server has checked the token.
 */
export async function createServiceClient() {
  // Same as the session client: mark the render as request-time before the client reads the clock.
  await connection();

  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not set");

  return createClient(supabaseUrl(), secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
