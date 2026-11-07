import { describe, expect, it } from "vitest";
import { createToken, deriveToken, isValidTokenFormat, sha256, tokenForRequest } from "@/lib/services/tokens";

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

describe("derived link tokens (ADR-15)", () => {
  const secret = "s".repeat(32);
  const id = "8a6e0804-2bd0-4672-b79d-d97027f9071a";

  it("gives the same well-formed token for the same request every time", () => {
    expect(deriveToken(id, secret)).toBe(deriveToken(id, secret));
    expect(isValidTokenFormat(deriveToken(id, secret))).toBe(true);
  });

  it("gives a different token for another request or another secret", () => {
    expect(deriveToken(id, secret)).not.toBe(deriveToken("5d8f7f7e-6a43-4c55-9d43-6f2d3f0b1c11", secret));
    expect(deriveToken(id, secret)).not.toBe(deriveToken(id, "t".repeat(32)));
  });

  it("refuses a missing or short secret", () => {
    expect(() => deriveToken(id, "")).toThrow();
    expect(() => deriveToken(id, "short")).toThrow();
  });

  it("rebuilds the token only when the stored hash matches", () => {
    process.env.LINK_TOKEN_SECRET = secret;
    const token = deriveToken(id);
    expect(tokenForRequest({ id, access_token_hash: sha256(token) })).toBe(token);
    expect(tokenForRequest({ id, access_token_hash: sha256(createToken()) })).toBeNull();
  });
});
