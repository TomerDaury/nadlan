"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { listAvailableAreas } from "@/lib/services/areas";
import { sendOutboxEmail } from "@/lib/services/email";
import { getRequestByToken, setNotifications, updateCriteria } from "@/lib/services/requests";
import { isInAreas, parseCriteria, requestFormValues, type RequestFieldErrors } from "@/lib/validation/request";

// Personal-page actions (ARCHITECTURE §2.5): allowed only to whoever holds the link token.
// Each one checks the token first; a wrong token reveals nothing.

export type CriteriaFormState = {
  fieldErrors?: RequestFieldErrors;
  formError?: string;
};

const FIX_FIELDS = "יש לתקן את השדות המסומנים";
const INVALID_LINK = "הקישור אינו תקין";

// updateCriteria(token, form) — PRD F5 "עדכון הקריטריונים".
export async function updateCriteriaAction(
  token: string,
  _prev: CriteriaFormState,
  formData: FormData
): Promise<CriteriaFormState> {
  const parsed = parseCriteria(requestFormValues(formData));
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, formError: FIX_FIELDS };

  try {
    const request = await getRequestByToken(token);
    if (!request) return { formError: INVALID_LINK };

    // Closed list, as in the request form.
    if (!isInAreas(parsed.data, await listAvailableAreas())) {
      return { fieldErrors: { neighborhoods: "יש לבחור עיר ושכונות מהרשימה" }, formError: FIX_FIELDS };
    }

    const outboxId = await updateCriteria(request.id, parsed.data);
    if (outboxId) after(() => sendOutboxEmail(outboxId));
  } catch (error) {
    console.error(error);
    return { formError: "השמירה נכשלה. נסו שוב." };
  }

  redirect(`/r/${token}?done=updated`);
}

// setNotifications(token, active) — PRD F5 "הפסקת עדכונים" and turning them back on.
// Runs only as a POST (form submit), never from opening a link (ARCHITECTURE §2.3).
export async function setNotificationsAction(token: string, active: boolean): Promise<void> {
  const request = await getRequestByToken(token);
  if (!request) redirect(`/r/${token}`);

  await setNotifications(request.id, active);
  redirect(`/r/${token}?done=${active ? "resumed" : "stopped"}`);
}
