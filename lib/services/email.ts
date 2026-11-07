import "server-only";
import { createElement } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NEW_PROPERTY_SUBJECT, NewPropertyEmail } from "@/emails/new-property-email";
import { ResultsEmail, resultsSubject, type ResultsEmailMatch } from "@/emails/results-email";
import { sendEmail, sendEmailBatch, type EmailMessage } from "@/lib/integrations/resend";
import { createServiceClient } from "@/lib/integrations/supabase/service";
import { publicImageUrl } from "@/lib/images";
import { formatPrice, propertyDetails } from "@/lib/format";
import {
  BATCH_SIZE,
  chunk,
  isRetryable,
  MAX_ATTEMPTS,
  RETRY_BATCH,
  SUBMISSION_LOG_TTL_MS,
  type OutboxRow,
} from "@/lib/services/email-outbox";
import { metCriteria } from "@/lib/services/notifications";
import type { PropertyImage } from "@/lib/services/properties";
import { getCurrentMatches } from "@/lib/services/requests";
import { tokenForRequest } from "@/lib/services/tokens";

// Sends the emails in email_outbox (PRD F4, F6, ARCHITECTURE §2.6 A–C). Each email is built when
// it is sent, from the current data, so a retry never sends stale content.

const OUTBOX_FIELDS = "id, request_id, kind, property_id, status, attempts, created_at";

type SendOutcome = "sent" | "failed" | "skipped";

function baseUrl(): string {
  const url = process.env.APP_BASE_URL;
  if (!url) throw new Error("APP_BASE_URL is not set");
  return url.replace(/\/+$/, "");
}

/** An email that can never be sent: no retries (attempts is set to the maximum). */
class PermanentEmailError extends Error {}

/** A request made before ADR-15: its link cannot be rebuilt, so it can never get an email. */
class LegacyTokenError extends PermanentEmailError {
  constructor() {
    super("legacy token: the personal link cannot be rebuilt (request created before ADR-15)");
  }
}

type RequestRow = {
  id: string;
  name: string;
  email: string;
  access_token_hash: string;
  notifications_active: boolean;
  max_budget: number;
  rooms_min: number;
  rooms_max: number;
};

async function loadRequest(supabase: SupabaseClient, requestId: string): Promise<RequestRow | null> {
  const { data, error } = await supabase
    .from("client_requests")
    .select("id, name, email, access_token_hash, notifications_active, max_budget, rooms_min, rooms_max")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { ...data, rooms_min: Number(data.rooms_min), rooms_max: Number(data.rooms_max) } as RequestRow;
}

function personalUrlFor(request: RequestRow): string {
  const token = tokenForRequest(request);
  if (!token) throw new LegacyTokenError();
  return `${baseUrl()}/r/${token}`;
}

/** The results email for one request (PRD F4). */
async function buildResultsEmail(request: RequestRow): Promise<EmailMessage> {
  const personalUrl = personalUrlFor(request);
  const matches: ResultsEmailMatch[] = (await getCurrentMatches(request.id)).map(({ property, reason }) => ({
    title: property.title,
    price: formatPrice(property.price),
    details: propertyDetails(property).join(" · "),
    reason,
    imageUrl: property.primaryImage ? publicImageUrl(property.primaryImage) : null,
    url: `${personalUrl}/properties/${property.id}`,
  }));

  return {
    to: request.email,
    subject: resultsSubject(matches.length),
    react: createElement(ResultsEmail, {
      name: request.name,
      matches,
      personalUrl,
      unsubscribeUrl: `${personalUrl}/unsubscribe`,
    }),
  };
}

/** The "new property" update email (PRD F6). */
async function buildNewPropertyEmail(
  supabase: SupabaseClient,
  request: RequestRow,
  propertyId: string | null
): Promise<EmailMessage> {
  // The client stopped updates after the email was queued: it must not be sent.
  if (!request.notifications_active) throw new PermanentEmailError("cancelled: the client stopped updates");
  if (!propertyId) throw new PermanentEmailError("cancelled: the property was deleted");

  const { data: property, error } = await supabase
    .from("properties")
    .select("id, title, city, neighborhood, price, rooms, area_sqm, floor, status, images:property_images(storage_path, is_primary, sort_order)")
    .eq("id", propertyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!property) throw new PermanentEmailError("cancelled: the property was deleted");
  if (property.status !== "available") throw new PermanentEmailError("cancelled: the property is no longer available");

  const rooms = Number(property.rooms);
  const images = [...(property.images as PropertyImage[])].sort((a, b) => a.sort_order - b.sort_order);
  const primaryImage = (images.find((i) => i.is_primary) ?? images[0])?.storage_path ?? null;
  const personalUrl = personalUrlFor(request);

  return {
    to: request.email,
    subject: NEW_PROPERTY_SUBJECT,
    react: createElement(NewPropertyEmail, {
      name: request.name,
      property: {
        title: property.title,
        price: formatPrice(property.price),
        details: propertyDetails({ ...property, rooms }).join(" · "),
        imageUrl: primaryImage ? publicImageUrl(primaryImage) : null,
        url: `${personalUrl}/properties/${property.id}`,
      },
      criteria: metCriteria({ ...property, rooms }, request),
      personalUrl,
      unsubscribeUrl: `${personalUrl}/unsubscribe`,
    }),
  };
}

/** Builds the email for an outbox row. null = the request was deleted (nothing to send). */
async function buildEmail(supabase: SupabaseClient, row: OutboxRow): Promise<EmailMessage | null> {
  // Deleted request: its outbox rows are deleted with it, so this is only a race.
  const request = await loadRequest(supabase, row.request_id);
  if (!request) return null;
  if (row.kind === "results") return buildResultsEmail(request);
  return buildNewPropertyEmail(supabase, request, row.property_id);
}

/** Takes a row for sending: attempts + 1, only if nobody else changed it. */
async function claim(supabase: SupabaseClient, row: OutboxRow): Promise<boolean> {
  const { data, error } = await supabase
    .from("email_outbox")
    .update({ attempts: row.attempts + 1 })
    .eq("id", row.id)
    .eq("attempts", row.attempts)
    .neq("status", "sent")
    .select("id");
  if (error) throw new Error(error.message);
  return Boolean(data?.length);
}

async function markSent(supabase: SupabaseClient, ids: string[]) {
  const { error } = await supabase
    .from("email_outbox")
    .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
    .in("id", ids);
  if (error) throw new Error(error.message);
}

async function markFailed(supabase: SupabaseClient, ids: string[], error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`email ${ids.join(", ")} failed: ${message}`);
  await supabase
    .from("email_outbox")
    .update({
      status: "failed",
      last_error: message.slice(0, 1000),
      // An email that can never be sent: stop retrying it.
      ...(error instanceof PermanentEmailError ? { attempts: MAX_ATTEMPTS } : {}),
    })
    .in("id", ids);
}

/**
 * Sends one outbox row. Never throws: a failure is saved on the row for the Cron to retry.
 * The row is claimed first, so the after() send and the Cron never send the same email twice.
 */
export async function sendOutboxEmail(id: string): Promise<SendOutcome> {
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

async function sendClaimed(supabase: SupabaseClient, row: OutboxRow): Promise<SendOutcome> {
  if (!(await claim(supabase, row))) return "skipped";
  try {
    const email = await buildEmail(supabase, row);
    if (email) await sendEmail(email);
    await markSent(supabase, [row.id]);
    return "sent";
  } catch (error) {
    await markFailed(supabase, [row.id], error);
    return "failed";
  }
}

/**
 * Sends new property emails in batches of up to 100 (ARCHITECTURE §2.6 B.4). Never throws.
 * Each batch is all-or-nothing at Resend: on failure all its rows stay for the Cron to retry.
 */
export async function sendNewPropertyBatch(ids: string[]) {
  const counts = { sent: 0, failed: 0, skipped: 0 };
  try {
    const supabase = await createServiceClient();
    for (const part of chunk(ids, BATCH_SIZE)) {
      const { data, error } = await supabase.from("email_outbox").select(OUTBOX_FIELDS).in("id", part);
      if (error) throw new Error(error.message);

      const ready: { id: string; email: EmailMessage }[] = [];
      for (const row of (data ?? []) as OutboxRow[]) {
        if (row.status === "sent" || row.attempts >= MAX_ATTEMPTS || !(await claim(supabase, row))) {
          counts.skipped++;
          continue;
        }
        try {
          const email = await buildEmail(supabase, row);
          if (email) ready.push({ id: row.id, email });
          else {
            await markSent(supabase, [row.id]);
            counts.skipped++;
          }
        } catch (buildError) {
          await markFailed(supabase, [row.id], buildError);
          counts.failed++;
        }
      }
      if (!ready.length) continue;

      const readyIds = ready.map((r) => r.id);
      try {
        await sendEmailBatch(ready.map((r) => r.email));
        await markSent(supabase, readyIds);
        counts.sent += ready.length;
      } catch (sendError) {
        await markFailed(supabase, readyIds, sendError);
        counts.failed += ready.length;
      }
    }
  } catch (error) {
    console.error("sendNewPropertyBatch failed", error);
  }
  return counts;
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
