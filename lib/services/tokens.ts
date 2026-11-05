import { createHash, randomBytes } from "node:crypto";

// Personal link tokens (ARCHITECTURE §2.7): 256 random bits, base64url.
// Only the SHA-256 hash is stored; the token itself exists only in the link.

const TOKEN_BYTES = 32;
/** 32 bytes in base64url (no padding) = 43 characters. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function isValidTokenFormat(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

/** SHA-256 hex. Used for link tokens and for IP addresses in the rate-limit log. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
