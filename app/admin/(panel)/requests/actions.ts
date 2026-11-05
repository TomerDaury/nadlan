"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/services/admin";
import { deleteRequest } from "@/lib/services/admin-requests";

const FAILED = "המחיקה נכשלה. נסו שוב.";

/** Deletes a request after the agent confirmed (PRD F9). */
export async function deleteRequestAction(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { error: FAILED };

  try {
    // 0 rows means it was already deleted (e.g. in another tab): treat as done.
    await deleteRequest(parsed.data);
  } catch (error) {
    console.error(error);
    return { error: FAILED };
  }
  redirect("/admin/requests?done=deleted");
}
