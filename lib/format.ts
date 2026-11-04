// Display helpers shared by all screens (DESIGN.md §2.2, §2.5).

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "₪ 1,950,000" — shekel sign first, then a space, then the number with thousands separators. */
export function formatPrice(amount: number): string {
  return `₪ ${numberFormatter.format(amount)}`;
}

/** "3.5–4" (min first, en dash). Equal values collapse to a single number: "4". */
export function formatRoomsRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}–${max}`;
}
