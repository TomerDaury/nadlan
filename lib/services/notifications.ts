import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPrice, formatRoomsRange } from "@/lib/format";

// New property notifications (PRD F6, ARCHITECTURE §2.6 B, ADR-17).
// No "server-only" import: the caller passes the database client, so this file is unit-testable.

/** The property fields the match needs. */
export type NewProperty = {
  id: string;
  city: string;
  neighborhood: string;
  price: number;
  rooms: number;
  status: string;
};

/** Keeps numbers and ranges left-to-right inside Hebrew text (LRI … PDI isolate, no-break space). */
function ltr(value: string): string {
  return `⁦${value.replace(" ", " ")}⁩`;
}

/**
 * The criteria the property meets, one line each, for the update email (PRD F6:
 * "ציון הקריטריונים שהנכס עומד בהם"). Built from data only, no written reason (PRD §6).
 */
export function metCriteria(
  property: { city: string; neighborhood: string; price: number; rooms: number },
  request: { max_budget: number; rooms_min: number; rooms_max: number }
): string[] {
  return [
    `אזור: ${property.neighborhood}, ${property.city}`,
    `מחיר: ${ltr(formatPrice(property.price))}, בתקציב שלכם (עד ${ltr(formatPrice(request.max_budget))})`,
    `חדרים: ${ltr(String(property.rooms))}, בטווח שביקשתם (${ltr(formatRoomsRange(request.rooms_min, request.rooms_max))})`,
  ];
}

/**
 * Active requests the property matches (the F2 filter seen from the property's side):
 * updates on, same city, its neighborhood among the chosen ones, price within the budget
 * and rooms within the range. The client's free text is not used (PRD F6).
 */
export async function findMatchingRequests(supabase: SupabaseClient, property: NewProperty): Promise<string[]> {
  if (property.status !== "available") return [];
  const { data, error } = await supabase
    .from("client_requests")
    .select("id")
    .eq("notifications_active", true)
    .eq("city", property.city)
    .contains("neighborhoods", [property.neighborhood])
    .gte("max_budget", property.price)
    .lte("rooms_min", property.rooms)
    .gte("rooms_max", property.rooms);
  if (error) throw new Error(`findMatchingRequests: ${error.message}`);
  return (data ?? []).map((row) => row.id as string);
}

/**
 * Saves the notification matches and their outbox rows in one transaction (database function).
 * Returns the new outbox ids; a request that already got this property gets nothing new.
 */
export async function recordNotifications(
  supabase: SupabaseClient,
  propertyId: string,
  requestIds: string[]
): Promise<string[]> {
  if (!requestIds.length) return [];
  const { data, error } = await supabase.rpc("record_property_notifications", {
    p_property_id: propertyId,
    p_request_ids: requestIds,
  });
  if (error) throw new Error(`recordNotifications: ${error.message}`);
  // "returns setof uuid" comes back as a plain array of ids.
  return (data ?? []) as string[];
}
