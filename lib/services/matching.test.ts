import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CANDIDATE_LIMIT,
  basicReason,
  defaultRanking,
  findCandidates,
  rankCandidates,
  type Candidate,
} from "@/lib/services/matching";

const criteria = {
  city: "תל אביב",
  neighborhoods: ["הצפון הישן", "נווה צדק"],
  max_budget: 2000000,
  rooms_min: 3.5,
  rooms_max: 4,
};

/** Fake query builder that records every call and resolves with the given rows. */
function fakeClient(rows: unknown[], error: { message: string } | null = null) {
  const calls: [string, ...unknown[]][] = [];
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "lte", "gte", "order", "limit"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => void) => resolve({ data: rows, error });
  const client = {
    from: (table: string) => {
      calls.push(["from", table]);
      return builder;
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

const candidate = (id: string, created_at: string, extra: Partial<Candidate> = {}): Candidate => ({
  id,
  title: `נכס ${id}`,
  neighborhood: "הצפון הישן",
  price: 1950000,
  rooms: 4,
  created_at,
  ...extra,
});

describe("findCandidates (SQL filter)", () => {
  it("applies every filter condition: status, city, neighborhoods, budget, rooms range, order and limit", async () => {
    const { client, calls } = fakeClient([]);
    await findCandidates(client, criteria);

    expect(calls).toContainEqual(["from", "properties"]);
    expect(calls).toContainEqual(["eq", "status", "available"]);
    expect(calls).toContainEqual(["eq", "city", "תל אביב"]);
    expect(calls).toContainEqual(["in", "neighborhood", ["הצפון הישן", "נווה צדק"]]);
    expect(calls).toContainEqual(["lte", "price", 2000000]);
    expect(calls).toContainEqual(["gte", "rooms", 3.5]);
    expect(calls).toContainEqual(["lte", "rooms", 4]);
    expect(calls).toContainEqual(["order", "created_at", { ascending: false }]);
    expect(calls).toContainEqual(["limit", CANDIDATE_LIMIT]);
  });

  it("turns the rooms value (numeric from Postgres) into a number", async () => {
    const { client } = fakeClient([{ ...candidate("a", "2026-11-01T00:00:00Z"), rooms: "3.5" }]);
    const [result] = await findCandidates(client, criteria);
    expect(result.rooms).toBe(3.5);
  });

  it("throws on a database error", async () => {
    const { client } = fakeClient([], { message: "boom" });
    await expect(findCandidates(client, criteria)).rejects.toThrow("boom");
  });
});

describe("defaultRanking", () => {
  it("returns at most 3, newest first, ranked 1..3, each with a reason", () => {
    const ranked = defaultRanking([
      candidate("old", "2026-10-01T00:00:00Z"),
      candidate("newest", "2026-11-04T00:00:00Z"),
      candidate("mid", "2026-10-20T00:00:00Z"),
      candidate("new", "2026-11-01T00:00:00Z"),
    ]);
    expect(ranked.map((m) => m.property_id)).toEqual(["newest", "new", "mid"]);
    expect(ranked.map((m) => m.rank)).toEqual([1, 2, 3]);
    expect(ranked.every((m) => m.reason.length > 0)).toBe(true);
  });

  it("shows only what was found when there are fewer than 3", () => {
    expect(defaultRanking([candidate("a", "2026-11-01T00:00:00Z")])).toHaveLength(1);
  });

  it("returns an empty list when nothing matched", () => {
    expect(defaultRanking([])).toEqual([]);
    expect(rankCandidates([])).toEqual([]);
  });
});

describe("basicReason", () => {
  it("is based only on the criteria the property meets", () => {
    expect(basicReason(candidate("a", "2026-11-01T00:00:00Z"))).toBe(
      "הנכס נמצא בשכונת הצפון הישן, במחיר \u2066₪\u00A01,950,000\u2069 שנמצא בתקציב שלכם, ועם 4 חדרים בטווח שביקשתם."
    );
  });

  it("says 'one room' for a single room", () => {
    expect(basicReason(candidate("a", "2026-11-01T00:00:00Z", { rooms: 1 }))).toContain("עם חדר אחד");
  });
});
