// Contact links to the agent (PRD F10): phone call and WhatsApp with a ready message.
// Pure functions (no "server-only"), so they are unit-testable.

const MIN_DIGITS = 9;
const MAX_DIGITS = 15;

/**
 * The agent's phone number in international digits (e.g. "972501234567"), or null when it is
 * missing or not a plausible number. Accepts "050-1234567", "0501234567", "+972 50-123-4567",
 * "972501234567", with spaces, dashes, dots or parentheses.
 */
export function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^\+?[\d\s\-().]+$/.test(trimmed)) return null;

  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2); // 00972... international prefix
  else if (digits.startsWith("0")) digits = `972${digits.slice(1)}`; // Israeli local format

  return digits.length >= MIN_DIGITS && digits.length <= MAX_DIGITS ? digits : null;
}

/** "tel:+972501234567" */
export function phoneHref(phone: string): string {
  return `tel:+${phone}`;
}

type PropertyForMessage = { title: string; neighborhood: string; city: string };

/** The ready WhatsApp message. Never includes the client's personal link (PRD F10). */
export function whatsappMessage(property: PropertyForMessage): string {
  return `שלום, אני מתעניין בנכס: ${property.title} (${property.neighborhood}, ${property.city})`;
}

/** "https://wa.me/972501234567?text=..." */
export function whatsappHref(phone: string, property: PropertyForMessage): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage(property))}`;
}
