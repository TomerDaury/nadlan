// Pure view helpers for the agent's request screens (PRD F9). No server imports, so it is unit-testable.

/** A request_matches row joined with its property; property is null once the property was deleted. */
export type MatchRow = {
  rank: number | null;
  reason: string | null;
  property: { id: string; title: string; price: number } | null;
};

export type ShownMatch = {
  rank: number;
  reason: string;
  deleted: boolean;
  title: string | null;
  price: number | null;
};

/**
 * Properties shown to the client, by rank. A deleted property (ON DELETE SET NULL) keeps
 * its place and reason, and is shown as "נכס שנמחק" (PRD edge cases).
 */
export function toShownMatches(rows: MatchRow[]): ShownMatch[] {
  return [...rows]
    .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
    .map((row, index) => ({
      rank: row.rank ?? index + 1,
      reason: row.reason ?? "",
      deleted: row.property === null,
      title: row.property?.title ?? null,
      price: row.property === null ? null : Number(row.property.price),
    }));
}
