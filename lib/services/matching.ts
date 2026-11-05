import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPrice } from "@/lib/format";
import type { Criteria } from "@/lib/validation/request";

// Matching engine (PRD F2). Milestone 3: SQL filter + default ranking (newest first) with a
// basic reason built from the criteria. AI ranking is deferred; when it is added it plugs
// into rankCandidates() only.
// No "server-only" import: the caller passes the database client, so this file is unit-testable.

/** At most this many candidates come back from the filter (ARCHITECTURE §2.6, assumption). */
export const CANDIDATE_LIMIT = 40;
/** At most this many properties are shown to the client (PRD F2). */
export const MAX_MATCHES = 3;

export type Candidate = {
  id: string;
  title: string;
  neighborhood: string;
  price: number;
  rooms: number;
  created_at: string;
};

export type RankedMatch = {
  property_id: string;
  title: string;
  rank: number;
  reason: string;
};

/** Hard filter in SQL: available, same city, chosen neighborhoods, within budget and rooms range. */
export async function findCandidates(supabase: SupabaseClient, criteria: Criteria): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, neighborhood, price, rooms, created_at")
    .eq("status", "available")
    .eq("city", criteria.city)
    .in("neighborhood", criteria.neighborhoods)
    .lte("price", criteria.max_budget)
    .gte("rooms", criteria.rooms_min)
    .lte("rooms", criteria.rooms_max)
    .order("created_at", { ascending: false })
    .limit(CANDIDATE_LIMIT);

  if (error) throw new Error(`findCandidates: ${error.message}`);
  return (data ?? []).map((row) => ({ ...row, rooms: Number(row.rooms) }) as Candidate);
}

/** Keeps "₪ 1,950,000" in left-to-right order and on one line inside Hebrew text (LRI … PDI isolate, no-break space). */
function ltr(text: string): string {
  return `\u2066${text.replace(" ", "\u00A0")}\u2069`;
}

function roomsText(rooms: number): string {
  return rooms === 1 ? "חדר אחד" : `${rooms} חדרים`;
}

/** Basic reason, based only on the criteria the property meets (PRD edge cases). */
export function basicReason(candidate: Candidate): string {
  return (
    `הנכס נמצא בשכונת ${candidate.neighborhood}, ` +
    `במחיר ${ltr(formatPrice(candidate.price))} שנמצא בתקציב שלכם, ` +
    `ועם ${roomsText(candidate.rooms)} בטווח שביקשתם.`
  );
}

/** Default ranking: newest first, top 3, basic reason for each. */
export function defaultRanking(candidates: Candidate[]): RankedMatch[] {
  return [...candidates]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, MAX_MATCHES)
    .map((candidate, index) => ({
      property_id: candidate.id,
      title: candidate.title,
      rank: index + 1,
      reason: basicReason(candidate),
    }));
}

/**
 * Picks and explains up to 3 properties. The client's free text is saved with the request
 * but not used yet: AI ranking is deferred, so this is the default ranking.
 */
export function rankCandidates(candidates: Candidate[]): RankedMatch[] {
  return defaultRanking(candidates);
}
