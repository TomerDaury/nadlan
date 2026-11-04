import { describe, expect, it } from "vitest";
import { formatPrice, formatRoomsRange } from "./format";

describe("formatPrice", () => {
  it("puts the shekel sign first with a space and thousands separators", () => {
    expect(formatPrice(1950000)).toBe("₪ 1,950,000");
  });

  it("handles small and round numbers", () => {
    expect(formatPrice(6500)).toBe("₪ 6,500");
    expect(formatPrice(999)).toBe("₪ 999");
  });

  it("drops fractions", () => {
    expect(formatPrice(1234.6)).toBe("₪ 1,235");
  });
});

describe("formatRoomsRange", () => {
  it("formats min–max with an en dash, min first", () => {
    expect(formatRoomsRange(3.5, 4)).toBe("3.5–4");
    expect(formatRoomsRange(2, 3)).toBe("2–3");
  });

  it("collapses an equal range to a single number", () => {
    expect(formatRoomsRange(4, 4)).toBe("4");
    expect(formatRoomsRange(3.5, 3.5)).toBe("3.5");
  });
});
