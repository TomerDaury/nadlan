import "server-only";
import { createServiceClient } from "@/lib/integrations/supabase/service";
import { sendNewPropertyBatch } from "@/lib/services/email";
import { findMatchingRequests, recordNotifications, type NewProperty } from "@/lib/services/notifications";

/**
 * Automatic update on a new property (PRD F6, ARCHITECTURE §2.6 B). Called in the background
 * (after()) when the agent creates an available property. Uses the secret key: the agent has
 * no insert rights on client tables (ADR-12). Never throws; what was queued but not sent is
 * retried by the Cron.
 */
export async function notifyNewProperty(propertyId: string) {
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("properties")
      .select("id, city, neighborhood, price, rooms, status")
      .eq("id", propertyId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || data.status !== "available") return;

    const property = { ...data, rooms: Number(data.rooms) } as NewProperty;
    const requestIds = await findMatchingRequests(supabase, property);
    const outboxIds = await recordNotifications(supabase, property.id, requestIds);
    if (!outboxIds.length) return;

    const counts = await sendNewPropertyBatch(outboxIds);
    console.info(`notifyNewProperty ${propertyId}: ${outboxIds.length} queued`, counts);
  } catch (error) {
    console.error("notifyNewProperty failed", error);
  }
}
