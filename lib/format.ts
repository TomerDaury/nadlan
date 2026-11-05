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
