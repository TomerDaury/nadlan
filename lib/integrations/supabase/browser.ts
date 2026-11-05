import { createBrowserClient } from "@supabase/ssr";

// Browser client: used only by the agent's image uploader (direct upload to Storage with RLS).
// NEXT_PUBLIC_* values must be read literally so Next.js inlines them into the bundle.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
