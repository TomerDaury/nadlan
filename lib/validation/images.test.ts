import { describe, expect, it } from "vitest";
import {
  buildImagePath,
  IMAGE_ERRORS,
  MAX_IMAGE_BYTES,
  parseImageList,
  validateImageFile,
  validateNewImages,
} from "@/lib/validation/images";

const PROPERTY = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const path = (n: number, property = PROPERTY) =>
  buildImagePath(property, "image/jpeg", `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`);

describe("validateImageFile", () => {
  it("accepts JPEG, PNG and WebP up to 5MB", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 1000 })).toBeNull();
    expect(validateImageFile({ type: "image/png", size: MAX_IMAGE_BYTES })).toBeNull();
    expect(validateImageFile({ type: "image/webp", size: 1 })).toBeNull();
  });

  it("rejects other file types", () => {
    expect(validateImageFile({ type: "image/gif", size: 1000 })).toBe(IMAGE_ERRORS.type);
    expect(validateImageFile({ type: "application/pdf", size: 1000 })).toBe(IMAGE_ERRORS.type);
  });

  it("rejects files larger than 5MB", () => {
    expect(validateImageFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 })).toBe(IMAGE_ERRORS.size);
  });
});

describe("validateNewImages", () => {
  const file = { type: "image/jpeg", size: 1000 };

  it("allows up to 10 images in total", () => {
    expect(validateNewImages([file, file], 8)).toBeNull();
    expect(validateNewImages([file, file, file], 8)).toBe(IMAGE_ERRORS.count);
  });
});

describe("parseImageList", () => {
  it("accepts an empty list", () => {
    expect(parseImageList("", "", PROPERTY)).toEqual({ success: true, data: { paths: [], primary: null } });
  });

  it("defaults the primary image to the first one", () => {
    const result = parseImageList(JSON.stringify([path(1), path(2)]), "", PROPERTY);
    expect(result).toEqual({ success: true, data: { paths: [path(1), path(2)], primary: path(1) } });
  });

  it("keeps a valid primary image", () => {
    const result = parseImageList(JSON.stringify([path(1), path(2)]), path(2), PROPERTY);
    expect(result.success && result.data.primary).toBe(path(2));
  });

  it("rejects more than 10 images", () => {
    const paths = Array.from({ length: 11 }, (_, i) => path(i));
    expect(parseImageList(JSON.stringify(paths), "", PROPERTY)).toEqual({ success: false, error: IMAGE_ERRORS.count });
  });

  it("rejects images from another property's folder", () => {
    expect(parseImageList(JSON.stringify([path(1, OTHER)]), "", PROPERTY).success).toBe(false);
  });

  it("rejects duplicates and malformed input", () => {
    expect(parseImageList(JSON.stringify([path(1), path(1)]), "", PROPERTY).success).toBe(false);
    expect(parseImageList("not json", "", PROPERTY).success).toBe(false);
    expect(parseImageList(JSON.stringify([1, 2]), "", PROPERTY).success).toBe(false);
    expect(parseImageList(JSON.stringify(["../../etc/passwd"]), "", PROPERTY).success).toBe(false);
  });
});
