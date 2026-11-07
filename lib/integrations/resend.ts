import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/components";
import { Resend } from "resend";

// Email sending through Resend (ARCHITECTURE §2.5). Server only: RESEND_API_KEY never reaches the browser.

let client: Resend | null = null;

function resend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  client ??= new Resend(key);
  return client;
}

/**
 * Sends one email. In Development EMAIL_TEST_RECIPIENT replaces the real recipient
 * (ARCHITECTURE §2.9), so test emails never reach real clients.
 * Throws with Resend's message when sending fails.
 */
export async function sendEmail(email: EmailMessage) {
  const { data, error } = await resend().emails.send(await prepare(email));
  if (error) throw new Error(`Resend: ${error.message}`);
  return data.id;
}

/** At most this many emails in one Resend batch call (ARCHITECTURE §2.5). */
export const MAX_BATCH = 100;

/**
 * Sends up to 100 emails in one call (Resend batch.send). The batch is all-or-nothing:
 * when it throws, none of the emails was sent.
 */
export async function sendEmailBatch(emails: EmailMessage[]) {
  if (!emails.length) return;
  if (emails.length > MAX_BATCH) throw new Error(`sendEmailBatch: at most ${MAX_BATCH} emails per batch`);
  const { error } = await resend().batch.send(await Promise.all(emails.map(prepare)));
  if (error) throw new Error(`Resend: ${error.message}`);
}

export type EmailMessage = { to: string; subject: string; react: ReactElement };

async function prepare({ to, subject, react }: EmailMessage) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not set");
  const recipient = process.env.EMAIL_TEST_RECIPIENT || to;

  // Rendered here rather than with Resend's `react` option: Resend loads the renderer with a
  // dynamic import that the Next.js bundler cannot resolve.
  const [html, text] = await Promise.all([render(react), render(react, { plainText: true })]);
  return { from, to: recipient, subject, html, text };
}
