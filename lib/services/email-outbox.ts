import type { SupabaseClient } from "@supabase/supabase-js";

// Email outbox rules (ARCHITECTURE §2.6 A, C). No "server-only" import: the caller passes
// the database client, so the retry rules are unit-testable.

export type EmailKind = "results" | "new_property";
export type EmailStatus = "pending" | "sent" | "failed";

/** A row is tried at most this many times. */
export const MAX_ATTEMPTS = 5;
/** A pending row younger than this is left to the after() send that created it. */
export const PENDING_GRACE_MS = 2 * 60 * 1000;
/** Rows the Cron handles per run. */
export const RETRY_BATCH = 50;
/** submission_log rows older than this are deleted by the Cron. */
export const SUBMISSION_LOG_TTL_MS = 24 * 60 * 60 * 1000;

export type OutboxRow = {
  id: string;
  request_id: string;
  kind: EmailKind;
  property_id: string | null;
  status: EmailStatus;
  attempts: number;
  created_at: string;
};

/** Should the Cron (re)send this row now? */
export function isRetryable(row: Pick<OutboxRow, "status" | "attempts" | "created_at">, now: number): boolean {
  if (row.status === "sent" || row.attempts >= MAX_ATTEMPTS) return false;
  if (row.status === "failed") return true;
  return now - Date.parse(row.created_at) >= PENDING_GRACE_MS;
}

/** Adds a pending email to the outbox and returns its id. */
export async function enqueueEmail(
  supabase: SupabaseClient,
  requestId: string,
  kind: EmailKind,
  propertyId: string | null = null
): Promise<string> {
  const { data, error } = await supabase
    .from("email_outbox")
    .insert({ request_id: requestId, kind, property_id: propertyId })
    .select("id")
    .single();
  if (error) throw new Error(`enqueueEmail: ${error.message}`);
  return data.id as string;
}
