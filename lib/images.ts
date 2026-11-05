import { IMAGE_BUCKET } from "@/lib/validation/images";

/** Public URL of an image in the property-images bucket. */
export function publicImageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}
