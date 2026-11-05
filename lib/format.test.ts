import { describe, expect, it } from "vitest";
import { formatArea, formatDate, formatPrice, formatRoomsRange } from "./format";

describe("formatDate", () => {
  it("formats as DD/MM/YYYY", () => {
    expect(formatDate("2026-11-04T10:00:00Z")).toBe("04/11/2026");
  });

  it("uses Israel time, not UTC", () => {
    // 23:30 UTC on Nov 3 is already Nov 4 in Israel (UTC+2).
    expect(formatDate("2026-11-03T23:30:00Z")).toBe("04/11/2026");
  });
});

describe("formatArea", () => {
  it("shows the city and one neighborhood", () => {
    expect(formatArea("חיפה", ["כרמל"])).toBe("חיפה • כרמל");
  });

  it("joins several neighborhoods with commas", () => {
    expect(formatArea("תל אביב", ["הצפון הישן", "נווה צדק"])).toBe("תל אביב • הצפון הישן, נווה צדק");
  });
});

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
