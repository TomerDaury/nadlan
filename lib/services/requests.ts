import "server-only";
import { createServiceClient } from "@/lib/integrations/supabase/service";
import { findCandidates, rankCandidates } from "@/lib/services/matching";
import { createToken, isValidTokenFormat, sha256 } from "@/lib/services/tokens";
import type { PropertyImage } from "@/lib/services/properties";
import type { PropertyInput } from "@/lib/validation/property";
import type { RequestInput } from "@/lib/validation/request";

// Client requests (PRD F1, F3, F4 – saving only). All access uses the secret key on the
// server; client data is returned only after the link token has been checked.

/** At most this many submissions per IP per hour (ARCHITECTURE §2.7, assumption). */
export const RATE_LIMIT_PER_HOUR = 5;

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = "23505";

export type SubmitResult = { status: "created"; token: string } | { status: "duplicate" } | { status: "rate_limited" };

/**
 * Saves a request and its initial matches (ARCHITECTURE §2.6 A).
 * - Same submission_id again (double click / resend) → "duplicate"; nothing new is created.
 * - Too many submissions from this IP in the last hour → "rate_limited"; nothing is created.
 */
export async function submitRequest(input: RequestInput, ip: string): Promise<SubmitResult> {
  const supabase = await createServiceClient();

  const { data: existing, error: existingError } = await supabase
    .from("client_requests")
    .select("id")
    .eq("submission_id", input.submission_id)
    .maybeSingle();
  if (existingError) throw new Error(`submitRequest: ${existingError.message}`);
  if (existing) return { status: "duplicate" };

  const ipHash = sha256(ip);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("submission_log")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", hourAgo);
  if (countError) throw new Error(`submitRequest: ${countError.message}`);
  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) return { status: "rate_limited" };

  const { error: logError } = await supabase.from("submission_log").insert({ ip_hash: ipHash });
  if (logError) throw new Error(`submitRequest: ${logError.message}`);

  const token = createToken();
  const { data: request, error: insertError } = await supabase
    .from("client_requests")
    .insert({
      submission_id: input.submission_id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      city: input.city,
      neighborhoods: input.neighborhoods,
      max_budget: input.max_budget,
      rooms_min: input.rooms_min,
      rooms_max: input.rooms_max,
      preferences_text: input.preferences_text,
      access_token_hash: sha256(token),
    })
    .select("id")
    .single();
  // Two submissions with the same id at the same moment: the other one won.
  if (insertError?.code === UNIQUE_VIOLATION) return { status: "duplicate" };
  if (insertError) throw new Error(`submitRequest: ${insertError.message}`);

  try {
    const matches = rankCandidates(await findCandidates(supabase, input));
    if (matches.length) {
      const { error } = await supabase.from("request_matches").insert(
        matches.map((m) => ({
          request_id: request.id,
          property_id: m.property_id,
          property_title_snapshot: m.title,
          source: "initial",
          rank: m.rank,
          reason: m.reason,
        }))
      );
      if (error) throw new Error(error.message);
    }
  } catch (error) {
    // The request is already saved (PRD: it is kept in any case). Show it with no results.
    console.error("submitRequest: matching failed", error);
  }

  return { status: "created", token };
}

export type ClientRequest = { id: string };

/** Finds a request by its link token. Invalid or unknown token → null (no details leak). */
export async function getRequestByToken(token: string): Promise<ClientRequest | null> {
  if (!isValidTokenFormat(token)) return null;

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("client_requests")
    .select("id")
    .eq("access_token_hash", sha256(token))
    .maybeSingle();
  if (error) throw new Error(`getRequestByToken: ${error.message}`);
  return data;
}

type PropertyRow = Omit<PropertyInput, "address" | "description" | "expected_rent" | "estimated_yield"> & {
  id: string;
  images: PropertyImage[];
};

export type MatchCard = {
  rank: number;
  reason: string;
  property: Omit<PropertyRow, "images"> & { primaryImage: string | null };
};

const CARD_FIELDS =
  "id, title, city, neighborhood, price, rooms, area_sqm, floor, has_parking, has_elevator, has_balcony, has_safe_room, has_storage, condition, status";

function primaryImagePath(images: PropertyImage[]): string | null {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  return (sorted.find((i) => i.is_primary) ?? sorted[0])?.storage_path ?? null;
}

/** Current initial matches, by rank. Matches whose property was deleted are not shown. */
export async function getCurrentMatches(requestId: string): Promise<MatchCard[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("request_matches")
    .select(`rank, reason, property:properties(${CARD_FIELDS}, images:property_images(storage_path, is_primary, sort_order))`)
    .eq("request_id", requestId)
    .eq("source", "initial")
    .eq("is_current", true)
    .order("rank", { ascending: true });
  if (error) throw new Error(`getCurrentMatches: ${error.message}`);

  return (data ?? []).flatMap((row) => {
    const property = row.property as unknown as PropertyRow | null;
    if (!property) return [];
    const { images, ...rest } = property;
    return [
      {
        rank: row.rank as number,
        reason: row.reason ?? "",
        property: { ...rest, rooms: Number(rest.rooms), primaryImage: primaryImagePath(images) },
      },
    ];
  });
}

export type MatchedProperty = PropertyInput & { id: string; images: PropertyImage[] };

/** A property's full details, only if it was matched to this request. */
export async function getMatchedProperty(requestId: string, propertyId: string): Promise<MatchedProperty | null> {
  const supabase = await createServiceClient();
  const { data: link, error: linkError } = await supabase
    .from("request_matches")
    .select("id")
    .eq("request_id", requestId)
    .eq("property_id", propertyId)
    .limit(1)
    .maybeSingle();
  if (linkError) throw new Error(`getMatchedProperty: ${linkError.message}`);
  if (!link) return null;

  const { data, error } = await supabase
    .from("properties")
    .select("*, images:property_images(storage_path, is_primary, sort_order)")
    .eq("id", propertyId)
    .maybeSingle();
  if (error) throw new Error(`getMatchedProperty: ${error.message}`);
  if (!data) return null;

  const images = [...(data.images as PropertyImage[])].sort((a, b) => {
    // Primary image first, then the agent's order.
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
  return {
    ...data,
    rooms: Number(data.rooms),
    estimated_yield: data.estimated_yield === null ? null : Number(data.estimated_yield),
    images,
  } as MatchedProperty;
}
