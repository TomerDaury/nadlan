import { describe, expect, it } from "vitest";
import { isRetryable, MAX_ATTEMPTS, PENDING_GRACE_MS } from "@/lib/services/email-outbox";

describe("isRetryable (Cron retries, ARCHITECTURE §2.6 C)", () => {
  const now = Date.parse("2026-11-06T12:00:00Z");
  const fresh = new Date(now - 30 * 1000).toISOString();
  const old = new Date(now - PENDING_GRACE_MS - 1000).toISOString();

  it("leaves a fresh pending email to the send that created it", () => {
    expect(isRetryable({ status: "pending", attempts: 0, created_at: fresh }, now)).toBe(false);
  });

  it("retries a pending email that is older than 2 minutes", () => {
    expect(isRetryable({ status: "pending", attempts: 0, created_at: old }, now)).toBe(true);
  });

  it("retries a failed email until it reached 5 attempts", () => {
    expect(isRetryable({ status: "failed", attempts: 1, created_at: fresh }, now)).toBe(true);
    expect(isRetryable({ status: "failed", attempts: MAX_ATTEMPTS - 1, created_at: old }, now)).toBe(true);
    expect(isRetryable({ status: "failed", attempts: MAX_ATTEMPTS, created_at: old }, now)).toBe(false);
  });

  it("never sends a sent email again", () => {
    expect(isRetryable({ status: "sent", attempts: 1, created_at: old }, now)).toBe(false);
  });
});
