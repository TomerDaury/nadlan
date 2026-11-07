"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/services/admin";
import { notifyNewProperty } from "@/lib/services/notify-new-property";
import * as properties from "@/lib/services/properties";
import { parseImageList } from "@/lib/validation/images";
import { parseProperty, propertyFormValues, type PropertyFieldErrors } from "@/lib/validation/property";

export type PropertyFormState = {
  fieldErrors?: PropertyFieldErrors;
  formError?: string;
};

const SAVE_FAILED = "השמירה נכשלה. נסו שוב.";

/** Validates fields + image list. Shared by create and update. */
function parseSubmission(formData: FormData, propertyId: string) {
  const fields = parseProperty(propertyFormValues(formData));
  const images = parseImageList(formData.get("images"), formData.get("primary_image"), propertyId);

  if (!fields.success || !images.success) {
    return {
      ok: false as const,
      state: {
        fieldErrors: {
          ...(fields.success ? {} : fields.fieldErrors),
          ...(images.success ? {} : { images: images.error }),
        },
        formError: "יש לתקן את השדות המסומנים",
      },
    };
  }
  return { ok: true as const, fields: fields.data, images: images.data };
}

const idSchema = z.uuid();

export async function createPropertyAction(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { formError: SAVE_FAILED };

  const parsed = parseSubmission(formData, id.data);
  if (!parsed.ok) return parsed.state;

  try {
    await properties.createProperty(id.data, parsed.fields, parsed.images);
  } catch (error) {
    console.error(error);
    return { formError: SAVE_FAILED };
  }
  // A new available property updates matching clients by email, in the background (PRD F6).
  // Editing a property never does (updatePropertyAction), not even a change to "available".
  if (parsed.fields.status === "available") after(() => notifyNewProperty(id.data));
  redirect("/admin/properties?done=created");
}

export async function updatePropertyAction(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { formError: SAVE_FAILED };

  const parsed = parseSubmission(formData, id.data);
  if (!parsed.ok) return parsed.state;

  try {
    await properties.updateProperty(id.data, parsed.fields, parsed.images);
  } catch (error) {
    console.error(error);
    return { formError: SAVE_FAILED };
  }
  redirect("/admin/properties?done=updated");
}

export async function deletePropertyAction(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: "המחיקה נכשלה. נסו שוב." };

  try {
    await properties.deleteProperty(parsed.data);
  } catch (error) {
    console.error(error);
    return { error: "המחיקה נכשלה. נסו שוב." };
  }
  redirect("/admin/properties?done=deleted");
}
