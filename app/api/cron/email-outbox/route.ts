import { timingSafeEqual } from "node:crypto";
import { runOutboxCron } from "@/lib/services/email";

// GET /api/cron/email-outbox — Vercel Cron only (ARCHITECTURE §2.5, §2.6 C).
// Vercel sends "Authorization: Bearer ${CRON_SECRET}"; anything else is rejected before any work.

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return Response.json(await runOutboxCron());
  } catch (error) {
    console.error(error);
    return Response.json({ error: "cron failed" }, { status: 500 });
  }
}
