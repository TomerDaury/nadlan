import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/integrations/supabase/server";
import { toShownMatches, type MatchRow, type ShownMatch } from "@/lib/admin-requests-view";

// Agent's read-only view of client requests (PRD F9). Runs with the agent's session,
// so the read-only RLS policies apply (ARCHITECTURE §2.7).

export type RequestListItem = {
  id: string;
  name: string;
  created_at: string;
  city: string;
  neighborhoods: string[];
  max_budget: number;
  rooms_min: number;
  rooms_max: number;
  notifications_active: boolean;
};

export type RequestDetails = RequestListItem & {
  email: string;
  phone: string | null;
  preferences_text: string;
  matches: ShownMatch[];
};

const LIST_FIELDS = "id, name, created_at, city, neighborhoods, max_budget, rooms_min, rooms_max, notifications_active";

function withNumbers<T extends { rooms_min: unknown; rooms_max: unknown }>(row: T) {
  return { ...row, rooms_min: Number(row.rooms_min), rooms_max: Number(row.rooms_max) };
}

/** All requests, newest first. */
export async function listRequests(): Promise<RequestListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_requests")
    .select(LIST_FIELDS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listRequests: ${error.message}`);
  return (data ?? []).map((row) => withNumbers(row) as RequestListItem);
}

/**
 * Permanently deletes a request (PRD F9). Its matches and queued emails go with it
 * (ON DELETE CASCADE). Returns how many rows were deleted (0 = already gone).
 */
export async function deleteRequest(id: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("client_requests").delete().eq("id", id).select("id");
  if (error) throw new Error(`deleteRequest: ${error.message}`);
  return data?.length ?? 0;
}

/** One request with the properties shown to the client. Unknown or malformed id → null. */
export async function getRequestDetails(id: string): Promise<RequestDetails | null> {
  if (!z.uuid().safeParse(id).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_requests")
    .select(`${LIST_FIELDS}, email, phone, preferences_text`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getRequestDetails: ${error.message}`);
  if (!data) return null;

  // Current initial matches only; matches from new-property updates come in Milestone 6.
  const { data: matches, error: matchesError } = await supabase
    .from("request_matches")
    .select("rank, reason, property:properties(id, title, price)")
    .eq("request_id", id)
    .eq("source", "initial")
    .eq("is_current", true)
    .order("rank", { ascending: true });
  if (matchesError) throw new Error(`getRequestDetails: ${matchesError.message}`);

  return {
    ...(withNumbers(data) as RequestListItem & Pick<RequestDetails, "email" | "phone" | "preferences_text">),
    matches: toShownMatches((matches ?? []) as unknown as MatchRow[]),
  };
}
