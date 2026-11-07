"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { listAvailableAreas } from "@/lib/services/areas";
import { sendOutboxEmail } from "@/lib/services/email";
import { submitRequest } from "@/lib/services/requests";
import { isInAreas, parseRequest, requestFormValues, type RequestFieldErrors } from "@/lib/validation/request";

export type RequestFormState = {
  fieldErrors?: RequestFieldErrors;
  formError?: string;
  /** The same submission was already received; the first one handles the redirect. */
  duplicate?: boolean;
};

const SUBMIT_FAILED = "השליחה נכשלה. נסו שוב.";

/** Client IP from the proxy headers (Vercel sets x-forwarded-for). */
async function clientIp(): Promise<string> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
}

// submitRequest(form) — public, rate limited (ARCHITECTURE §2.5).
export async function submitRequestAction(_prev: RequestFormState, formData: FormData): Promise<RequestFormState> {
  const parsed = parseRequest(requestFormValues(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors, formError: "יש לתקן את השדות המסומנים" };
  }

  let token: string;
  try {
    // Closed list: the city and neighborhoods must come from available properties.
    if (!isInAreas(parsed.data, await listAvailableAreas())) {
      return {
        fieldErrors: { neighborhoods: "יש לבחור עיר ושכונות מהרשימה" },
        formError: "יש לתקן את השדות המסומנים",
      };
    }

    const result = await submitRequest(parsed.data, await clientIp());
    if (result.status === "duplicate") return { duplicate: true };
    if (result.status === "rate_limited") {
      return { formError: "שלחתם כמה פניות בזמן קצר. נסו שוב בעוד שעה." };
    }
    token = result.token;
    // The results email goes out after the response, so the client never waits for it.
    // If it fails, the outbox row stays for the Cron to retry (ARCHITECTURE §2.6 A).
    const { outboxId } = result;
    if (outboxId) after(() => sendOutboxEmail(outboxId));
  } catch (error) {
    console.error(error);
    return { formError: SUBMIT_FAILED };
  }

  redirect(`/r/${token}?view=results`);
}
