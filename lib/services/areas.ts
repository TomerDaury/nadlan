import "server-only";
import { createServiceClient } from "@/lib/integrations/supabase/service";

export type Area = { city: string; neighborhoods: string[] };

const byHebrew = (a: string, b: string) => a.localeCompare(b, "he");

/** Closed list of cities and neighborhoods for the public form (available properties only). */
export async function listAvailableAreas(): Promise<Area[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from("available_areas").select("city, neighborhood");
  if (error) throw new Error(`listAvailableAreas: ${error.message}`);

  const byCity = new Map<string, string[]>();
  for (const { city, neighborhood } of data ?? []) {
    byCity.set(city, [...(byCity.get(city) ?? []), neighborhood]);
  }
  return [...byCity.entries()]
    .map(([city, neighborhoods]) => ({ city, neighborhoods: neighborhoods.sort(byHebrew) }))
    .sort((a, b) => byHebrew(a.city, b.city));
}
