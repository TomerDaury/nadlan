import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { findMatchingRequests, metCriteria, recordNotifications, type NewProperty } from "@/lib/services/notifications";

const property: NewProperty = {
  id: "p1",
  city: "תל אביב",
  neighborhood: "נווה צדק",
  price: 1950000,
  rooms: 4,
  status: "available",
};

/** Fake client that records every call and resolves with the given result. */
function fakeClient(result: { data: unknown; error: { message: string } | null }) {
  const calls: [string, ...unknown[]][] = [];
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "contains", "gte", "lte"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => void) => resolve(result);
  const client = {
    from: (table: string) => {
      calls.push(["from", table]);
      return builder;
    },
    rpc: (name: string, args: unknown) => {
      calls.push(["rpc", name, args]);
      return Promise.resolve(result);
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe("findMatchingRequests (new property → active requests)", () => {
  it("filters by updates on, city, neighborhood, budget and rooms range", async () => {
    const { client, calls } = fakeClient({ data: [{ id: "r1" }, { id: "r2" }], error: null });
    const ids = await findMatchingRequests(client, property);

    expect(ids).toEqual(["r1", "r2"]);
    expect(calls).toEqual([
      ["from", "client_requests"],
      ["select", "id"],
      ["eq", "notifications_active", true],
      ["eq", "city", "תל אביב"],
      ["contains", "neighborhoods", ["נווה צדק"]],
      ["gte", "max_budget", 1950000],
      ["lte", "rooms_min", 4],
      ["gte", "rooms_max", 4],
    ]);
  });

  it("returns an empty list when no request matches", async () => {
    const { client } = fakeClient({ data: [], error: null });
    expect(await findMatchingRequests(client, property)).toEqual([]);
  });

  it("does not query at all for a property that is not available", async () => {
    const { client, calls } = fakeClient({ data: [{ id: "r1" }], error: null });
    expect(await findMatchingRequests(client, { ...property, status: "unavailable" })).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("throws when the query fails", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } });
    await expect(findMatchingRequests(client, property)).rejects.toThrow("findMatchingRequests: boom");
  });
});

describe("metCriteria (lines in the update email)", () => {
  it("lists the area, the price within the budget and the rooms within the range", () => {
    const lines = metCriteria(property, { max_budget: 2000000, rooms_min: 3.5, rooms_max: 4 });
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("אזור: נווה צדק, תל אביב");
    expect(lines[1]).toContain("1,950,000");
    expect(lines[1]).toContain("2,000,000");
    expect(lines[2]).toContain("3.5–4");
  });
});

describe("recordNotifications", () => {
  it("calls the database function with the property and the requests", async () => {
    const { client, calls } = fakeClient({ data: ["o1", "o2"], error: null });
    expect(await recordNotifications(client, "p1", ["r1", "r2"])).toEqual(["o1", "o2"]);
    expect(calls).toEqual([["rpc", "record_property_notifications", { p_property_id: "p1", p_request_ids: ["r1", "r2"] }]]);
  });

  it("does nothing when there are no requests", async () => {
    const { client, calls } = fakeClient({ data: ["o1"], error: null });
    expect(await recordNotifications(client, "p1", [])).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("throws when the database function fails", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } });
    await expect(recordNotifications(client, "p1", ["r1"])).rejects.toThrow("recordNotifications: boom");
  });
});
