// Property image rules (PRD F8, ARCHITECTURE §2.4 Storage). Same limits are enforced by the bucket.

export const MAX_IMAGES = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_BUCKET = "property-images";

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const IMAGE_ERRORS = {
  type: "ניתן להעלות רק תמונות מסוג JPG, ‏PNG או WebP",
  size: "כל תמונה יכולה להיות עד 5MB",
  count: `ניתן להעלות עד ${MAX_IMAGES} תמונות לנכס`,
  invalid: "רשימת התמונות אינה תקינה",
} as const;

/** Checks one file before upload. Returns an error message, or null when valid. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!(file.type in IMAGE_TYPES)) return IMAGE_ERRORS.type;
  if (file.size > MAX_IMAGE_BYTES) return IMAGE_ERRORS.size;
  return null;
}

/** Checks a batch of new files against the images already attached. */
export function validateNewImages(
  files: { type: string; size: number }[],
  existingCount: number
): string | null {
  if (existingCount + files.length > MAX_IMAGES) return IMAGE_ERRORS.count;
  for (const file of files) {
    const error = validateImageFile(file);
    if (error) return error;
  }
  return null;
}

/** Storage path for a new image: properties/<propertyId>/<random>.<ext> */
export function buildImagePath(propertyId: string, mimeType: string, randomId: string): string {
  const ext = IMAGE_TYPES[mimeType] ?? "jpg";
  return `properties/${propertyId}/${randomId}.${ext}`;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export function isImagePathOfProperty(path: string, propertyId: string): boolean {
  return new RegExp(`^properties/${propertyId}/${UUID}\\.(jpg|png|webp)$`, "i").test(path);
}

export type ImageList = { paths: string[]; primary: string | null };

/**
 * Server-side check of the submitted image list: at most 10, unique, all inside this
 * property's folder. The primary defaults to the first image.
 */
export function parseImageList(
  rawPaths: unknown,
  rawPrimary: unknown,
  propertyId: string
): { success: true; data: ImageList } | { success: false; error: string } {
  let paths: unknown;
  try {
    paths = typeof rawPaths === "string" && rawPaths !== "" ? JSON.parse(rawPaths) : [];
  } catch {
    return { success: false, error: IMAGE_ERRORS.invalid };
  }

  if (!Array.isArray(paths) || !paths.every((p) => typeof p === "string")) {
    return { success: false, error: IMAGE_ERRORS.invalid };
  }
  if (paths.length > MAX_IMAGES) return { success: false, error: IMAGE_ERRORS.count };
  if (new Set(paths).size !== paths.length) return { success: false, error: IMAGE_ERRORS.invalid };
  if (!paths.every((p) => isImagePathOfProperty(p, propertyId))) {
    return { success: false, error: IMAGE_ERRORS.invalid };
  }

  const primary =
    typeof rawPrimary === "string" && paths.includes(rawPrimary) ? rawPrimary : (paths[0] ?? null);

  return { success: true, data: { paths, primary } };
}
