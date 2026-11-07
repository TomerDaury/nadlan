import { createHash, createHmac, randomBytes } from "node:crypto";

// Personal link tokens (ARCHITECTURE §2.7, ADR-15): 256 bits, base64url.
// Only the SHA-256 hash is stored. New tokens are derived from the request id with a secret
// key (HMAC), so the server can rebuild the link for later emails without storing it.

const TOKEN_BYTES = 32;
/** 32 bytes in base64url (no padding) = 43 characters. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** The link secret must be long enough that it cannot be guessed. */
export const MIN_SECRET_LENGTH = 32;

/** Random token. Used by requests created before ADR-15 (and in tests). */
export function createToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** The request's link token: HMAC-SHA256(LINK_TOKEN_SECRET, request id), base64url. */
export function deriveToken(requestId: string, secret = process.env.LINK_TOKEN_SECRET): string {
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`LINK_TOKEN_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters`);
  }
  return createHmac("sha256", secret).update(requestId).digest("base64url");
}

export function isValidTokenFormat(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

/** SHA-256 hex. Used for link tokens and for IP addresses in the rate-limit log. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * The link token for a stored request, or null if its hash does not match the derived token
 * (a request created before ADR-15, with a random token that was never stored).
 */
export function tokenForRequest(request: { id: string; access_token_hash: string }): string | null {
  const token = deriveToken(request.id);
  return sha256(token) === request.access_token_hash ? token : null;
}
