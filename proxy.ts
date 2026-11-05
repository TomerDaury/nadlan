import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/integrations/supabase/proxy";

// Session refresh only (ARCHITECTURE §2.7). Authorization happens in requireAdmin().
export async function proxy(request: NextRequest) {
  // Before Supabase is configured there is no session to refresh; pages still run
  // requireAdmin(), which fails closed. This only keeps /admin/login viewable.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
