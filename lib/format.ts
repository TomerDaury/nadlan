// Display helpers shared by all screens (DESIGN.md §2.2, §2.5).

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "₪ 1,950,000" — shekel sign first, then a space, then the number with thousands separators. */
export function formatPrice(amount: number): string {
  return `₪ ${numberFormatter.format(amount)}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jerusalem",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "04/11/2026" — day/month/year in Israel time. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** "תל אביב • הצפון הישן, נווה צדק" — city, then the chosen neighborhoods. */
export function formatArea(city: string, neighborhoods: string[]): string {
  return neighborhoods.length ? `${city} • ${neighborhoods.join(", ")}` : city;
}

/** "3.5–4" (min first, en dash). Equal values collapse to a single number: "4". */
export function formatRoomsRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}–${max}`;
}

/** "הצפון הישן · 4 חד' · 95 מ"ר · קומה 3" parts — only the values that exist. */
export function propertyDetails(property: {
  neighborhood: string;
  rooms: number;
  area_sqm?: number | null;
  floor?: number | null;
}): string[] {
  return [
    property.neighborhood,
    `${property.rooms} חד'`,
    property.area_sqm ? `${property.area_sqm} מ"ר` : null,
    property.floor === null || property.floor === undefined ? null : property.floor === 0 ? "קרקע" : `קומה ${property.floor}`,
  ].filter((v): v is string => Boolean(v));
}
