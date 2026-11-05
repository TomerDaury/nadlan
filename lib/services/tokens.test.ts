import { describe, expect, it } from "vitest";
import { createToken, isValidTokenFormat, sha256 } from "@/lib/services/tokens";

describe("personal link tokens", () => {
  it("creates a 43-character base64url token (256 bits) that is different every time", () => {
    const a = createToken();
    const b = createToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });

  it("stores a hash that is not the token itself and is always the same for the same token", () => {
    const token = createToken();
    expect(sha256(token)).not.toBe(token);
    expect(sha256(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256(token)).toBe(sha256(token));
  });

  it("accepts only well-formed tokens", () => {
    expect(isValidTokenFormat(createToken())).toBe(true);
    expect(isValidTokenFormat("abc")).toBe(false);
    expect(isValidTokenFormat("a".repeat(42) + "!")).toBe(false);
    expect(isValidTokenFormat("")).toBe(false);
  });
});
