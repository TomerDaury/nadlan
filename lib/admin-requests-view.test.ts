import { describe, expect, it } from "vitest";
import { toShownMatches, type MatchRow } from "./admin-requests-view";

const existing = (rank: number, title: string, price: number): MatchRow => ({
  rank,
  reason: `נימוק ${rank}`,
  property: { id: `p${rank}`, title, price },
});

describe("toShownMatches", () => {
  it("shows an existing property with its title, price and reason", () => {
    expect(toShownMatches([existing(1, "דירת גן", 1820000)])).toEqual([
      { rank: 1, reason: "נימוק 1", deleted: false, title: "דירת גן", price: 1820000 },
    ]);
  });

  it("marks a deleted property but keeps its rank and reason", () => {
    const [match] = toShownMatches([{ rank: 3, reason: "מרפסת גג", property: null }]);
    expect(match).toEqual({ rank: 3, reason: "מרפסת גג", deleted: true, title: null, price: null });
  });

  it("keeps the ranking order", () => {
    const rows = [existing(2, "ב", 2), { rank: 3, reason: null, property: null }, existing(1, "א", 1)];
    expect(toShownMatches(rows).map((m) => m.rank)).toEqual([1, 2, 3]);
  });

  it("converts a numeric price that arrives as a string", () => {
    const row = { rank: 1, reason: "", property: { id: "p", title: "x", price: "950000" as unknown as number } };
    expect(toShownMatches([row])[0].price).toBe(950000);
  });

  it("returns an empty list when nothing was shown", () => {
    expect(toShownMatches([])).toEqual([]);
  });
});
