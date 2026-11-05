import "server-only";
import { createClient } from "@/lib/integrations/supabase/server";
import { IMAGE_BUCKET, type ImageList } from "@/lib/validation/images";
import type { PropertyInput } from "@/lib/validation/property";

// Property CRUD (PRD F8). Runs as the signed-in agent, so RLS applies to every query.

export type PropertyListItem = {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  price: number;
  rooms: number;
  status: PropertyInput["status"];
};

export type PropertyImage = { storage_path: string; is_primary: boolean; sort_order: number };

export type Property = PropertyInput & { id: string; images: PropertyImage[] };

export async function listProperties(): Promise<PropertyListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, city, neighborhood, price, rooms, status")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listProperties: ${error.message}`);
  return (data ?? []).map((row) => ({ ...row, rooms: Number(row.rooms) }));
}

export async function getProperty(id: string): Promise<Property | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, images:property_images(storage_path, is_primary, sort_order)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getProperty: ${error.message}`);
  if (!data) return null;

  const images = [...(data.images as PropertyImage[])].sort((a, b) => a.sort_order - b.sort_order);
  return {
    ...data,
    rooms: Number(data.rooms),
    estimated_yield: data.estimated_yield === null ? null : Number(data.estimated_yield),
    images,
  } as Property;
}

export async function createProperty(id: string, input: PropertyInput, images: ImageList) {
  const supabase = await createClient();
  const { error } = await supabase.from("properties").insert({ id, ...input });
  if (error) throw new Error(`createProperty: ${error.message}`);
  await syncImages(id, images);
}

export async function updateProperty(id: string, input: PropertyInput, images: ImageList) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("properties").update(input).eq("id", id).select("id");
  if (error) throw new Error(`updateProperty: ${error.message}`);
  if (!data?.length) throw new Error("updateProperty: property not found");
  await syncImages(id, images);
}

/** Deletes the property row (images cascade) and its files in the bucket. */
export async function deleteProperty(id: string) {
  const supabase = await createClient();
  const { data: images, error: readError } = await supabase
    .from("property_images")
    .select("storage_path")
    .eq("property_id", id);
  if (readError) throw new Error(`deleteProperty: ${readError.message}`);

  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw new Error(`deleteProperty: ${error.message}`);

  await removeFiles((images ?? []).map((i) => i.storage_path));
}

/**
 * Makes property_images match the submitted list: removes dropped images (rows + files),
 * then writes order and the single primary image.
 */
async function syncImages(propertyId: string, { paths, primary }: ImageList) {
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("property_images")
    .select("storage_path")
    .eq("property_id", propertyId);
  if (readError) throw new Error(`syncImages: ${readError.message}`);

  const removed = (existing ?? []).map((i) => i.storage_path).filter((p) => !paths.includes(p));
  if (removed.length) {
    const { error } = await supabase.from("property_images").delete().in("storage_path", removed);
    if (error) throw new Error(`syncImages: ${error.message}`);
    await removeFiles(removed);
  }

  // Clear the old primary first so the "one primary per property" index never conflicts.
  const { error: clearError } = await supabase
    .from("property_images")
    .update({ is_primary: false })
    .eq("property_id", propertyId);
  if (clearError) throw new Error(`syncImages: ${clearError.message}`);

  if (!paths.length) return;

  const { error } = await supabase.from("property_images").upsert(
    paths.map((storage_path, index) => ({
      property_id: propertyId,
      storage_path,
      is_primary: storage_path === primary,
      sort_order: index,
    })),
    { onConflict: "storage_path" }
  );
  if (error) throw new Error(`syncImages: ${error.message}`);
}

async function removeFiles(paths: string[]) {
  if (!paths.length) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  // The data change already succeeded; a leftover file is not worth failing the action.
  if (error) console.error("removeFiles:", error.message);
}
