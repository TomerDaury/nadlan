import "server-only";
import { createElement } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ResultsEmail, resultsSubject, type ResultsEmailMatch } from "@/emails/results-email";
import { sendEmail } from "@/lib/integrations/resend";
import { createServiceClient } from "@/lib/integrations/supabase/service";
import { publicImageUrl } from "@/lib/images";
import { formatPrice, propertyDetails } from "@/lib/format";
import {
  isRetryable,
  MAX_ATTEMPTS,
  RETRY_BATCH,
  SUBMISSION_LOG_TTL_MS,
  type OutboxRow,
} from "@/lib/services/email-outbox";
import { getCurrentMatches } from "@/lib/services/requests";
import { tokenForRequest } from "@/lib/services/tokens";

// Sends the emails in email_outbox (PRD F4, ARCHITECTURE §2.6 A, C). Each email is built when
// it is sent, from the request's current data, so a retry never sends stale results.

const OUTBOX_FIELDS = "id, request_id, kind, property_id, status, attempts, created_at";

function baseUrl(): string {
  const url = process.env.APP_BASE_URL;
  if (!url) throw new Error("APP_BASE_URL is not set");
  return url.replace(/\/+$/, "");
}

/** Builds and sends the results email for one request. Throws when it cannot be sent. */
async function sendResultsEmail(supabase: SupabaseClient, requestId: string) {
  const { data: request, error } = await supabase
    .from("client_requests")
    .select("id, name, email, access_token_hash")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  // Deleted request: its outbox rows are deleted with it, so this is only a race. Nothing to send.
  if (!request) return;

  const token = tokenForRequest(request);
  if (!token) throw new LegacyTokenError();

  const personalUrl = `${baseUrl()}/r/${token}`;
  const matches: ResultsEmailMatch[] = (await getCurrentMatches(request.id)).map(({ property, reason }) => ({
    title: property.title,
    price: formatPrice(property.price),
    details: propertyDetails(property).join(" · "),
    reason,
    imageUrl: property.primaryImage ? publicImageUrl(property.primaryImage) : null,
    url: `${personalUrl}/properties/${property.id}`,
  }));

  await sendEmail({
    to: request.email,
    subject: resultsSubject(matches.length),
    react: createElement(ResultsEmail, {
      name: request.name,
      matches,
      personalUrl,
      unsubscribeUrl: `${personalUrl}/unsubscribe`,
    }),
  });
}

/** A request made before ADR-15: its link cannot be rebuilt, so it can never get an email. */
class LegacyTokenError extends Error {
  constructor() {
    super("legacy token: the personal link cannot be rebuilt (request created before ADR-15)");
  }
}

/**
 * Sends one outbox row. Never throws: a failure is saved on the row for the Cron to retry.
 * The row is "claimed" first (attempts + 1 only if nobody else changed it), so the after()
 * send and the Cron never send the same email twice.
 */
export async function sendOutboxEmail(id: string): Promise<"sent" | "failed" | "skipped"> {
  try {
    const supabase = await createServiceClient();
    const { data: row, error } = await supabase.from("email_outbox").select(OUTBOX_FIELDS).eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.status === "sent" || row.attempts >= MAX_ATTEMPTS) return "skipped";
    return await sendClaimed(supabase, row as OutboxRow);
  } catch (error) {
    console.error("sendOutboxEmail failed", error);
    return "failed";
  }
}

async function sendClaimed(supabase: SupabaseClient, row: OutboxRow): Promise<"sent" | "failed" | "skipped"> {
  const { data: claimed, error: claimError } = await supabase
    .from("email_outbox")
    .update({ attempts: row.attempts + 1 })
    .eq("id", row.id)
    .eq("attempts", row.attempts)
    .neq("status", "sent")
    .select("id");
  if (claimError) throw new Error(claimError.message);
  if (!claimed?.length) return "skipped";

  try {
    if (row.kind !== "results") throw new Error(`email kind "${row.kind}" is not supported yet`);
    await sendResultsEmail(supabase, row.request_id);
    const { error } = await supabase
      .from("email_outbox")
      .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`email ${row.id} failed: ${message}`);
    await supabase
      .from("email_outbox")
      .update({
        status: "failed",
        last_error: message.slice(0, 1000),
        // A legacy request will never succeed: stop retrying it.
        ...(error instanceof LegacyTokenError ? { attempts: MAX_ATTEMPTS } : {}),
      })
      .eq("id", row.id);
    return "failed";
  }
}

/**
 * The Cron's work (ARCHITECTURE §2.6 C): retries pending emails older than 2 minutes and
 * failed ones with fewer than 5 attempts, then deletes submission_log rows older than 24 hours.
 */
export async function runOutboxCron() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("email_outbox")
    .select(OUTBOX_FIELDS)
    .in("status", ["pending", "failed"])
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(RETRY_BATCH);
  if (error) throw new Error(`runOutboxCron: ${error.message}`);

  const now = Date.now();
  const counts = { sent: 0, failed: 0, skipped: 0 };
  for (const row of (data ?? []) as OutboxRow[]) {
    if (!isRetryable(row, now)) continue;
    try {
      counts[await sendClaimed(supabase, row)]++;
    } catch (claimError) {
      console.error("runOutboxCron: claim failed", claimError);
      counts.failed++;
    }
  }

  const cutoff = new Date(now - SUBMISSION_LOG_TTL_MS).toISOString();
  const { count: cleaned, error: cleanError } = await supabase
    .from("submission_log")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);
  if (cleanError) throw new Error(`runOutboxCron: ${cleanError.message}`);

  return { ...counts, submissionLogDeleted: cleaned ?? 0 };
}
