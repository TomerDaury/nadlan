import { describe, expect, it } from "vitest";
import { parseProperty, propertyFormValues } from "@/lib/validation/property";

const valid = {
  title: "דירת 4 חדרים",
  address: "",
  city: "תל אביב",
  neighborhood: "הצפון הישן",
  price: "1950000",
  rooms: "4",
  area_sqm: "",
  floor: "",
  condition: "",
  description: "",
  expected_rent: "",
  estimated_yield: "",
  status: "available",
};

describe("parseProperty", () => {
  it("accepts the required fields and turns empty optional fields into null", () => {
    const result = parseProperty(valid);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      title: "דירת 4 חדרים",
      price: 1950000,
      rooms: 4,
      address: null,
      area_sqm: null,
      floor: null,
      condition: null,
      description: null,
      expected_rent: null,
      estimated_yield: null,
      has_parking: false,
    });
  });

  it.each(["title", "city", "neighborhood", "price", "rooms", "status"])("rejects a missing %s", (field) => {
    const result = parseProperty({ ...valid, [field]: "" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors[field as keyof typeof result.fieldErrors]).toBeTruthy();
  });

  it("rejects a zero or negative price", () => {
    for (const price of ["0", "-100"]) {
      const result = parseProperty({ ...valid, price });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.fieldErrors.price).toBe("המחיר חייב להיות גדול מ-0");
    }
  });

  it("accepts half rooms but not other fractions", () => {
    expect(parseProperty({ ...valid, rooms: "3.5" }).success).toBe(true);
    const bad = parseProperty({ ...valid, rooms: "3.3" });
    expect(bad.success).toBe(false);
  });

  it("checks the yield range", () => {
    expect(parseProperty({ ...valid, estimated_yield: "4.25" }).success).toBe(true);
    expect(parseProperty({ ...valid, estimated_yield: "100" }).success).toBe(false);
    expect(parseProperty({ ...valid, estimated_yield: "-1" }).success).toBe(false);
  });

  it("rejects an unknown condition or status", () => {
    expect(parseProperty({ ...valid, condition: "old" }).success).toBe(false);
    expect(parseProperty({ ...valid, status: "sold" }).success).toBe(false);
  });

  it("reads checkboxes from FormData (checked = 'on', unchecked = missing)", () => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(valid)) formData.set(key, value);
    formData.set("has_parking", "on");
    formData.set("has_safe_room", "on");

    const result = parseProperty(propertyFormValues(formData));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.has_parking).toBe(true);
    expect(result.data.has_safe_room).toBe(true);
    expect(result.data.has_elevator).toBe(false);
  });
});
