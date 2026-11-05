import { z } from "zod";

// Property form schema (PRD F8). Shared by the browser form and the server actions.

export const PROPERTY_CONDITIONS = ["new", "renovated", "needs_renovation"] as const;
export const PROPERTY_STATUSES = ["available", "unavailable"] as const;

export const CONDITION_LABELS: Record<(typeof PROPERTY_CONDITIONS)[number], string> = {
  new: "חדש",
  renovated: "משופץ",
  needs_renovation: "דרוש שיפוץ",
};

export const STATUS_LABELS: Record<(typeof PROPERTY_STATUSES)[number], string> = {
  available: "זמין",
  unavailable: "לא זמין",
};

export const FEATURE_FIELDS = [
  { name: "has_parking", label: "חניה" },
  { name: "has_elevator", label: "מעלית" },
  { name: "has_balcony", label: "מרפסת" },
  { name: "has_safe_room", label: 'ממ"ד' },
  { name: "has_storage", label: "מחסן" },
] as const;

/** Empty text → null; otherwise trimmed. */
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

const requiredText = (message: string) => z.string({ error: message }).trim().min(1, message);

/** Optional number from a form field: empty → null. */
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), schema.nullable());

/** Required number from a form field: empty → undefined, so the schema's own "required" message shows. */
const requiredNumber = (schema: z.ZodType<number>) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)), schema);

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const propertySchema = z.object({
  title: requiredText("יש להזין כותרת"),
  address: optionalText,
  city: requiredText("יש להזין עיר"),
  neighborhood: requiredText("יש להזין שכונה"),
  price: requiredNumber(
    z.number({ error: "יש להזין מחיר" }).int("המחיר חייב להיות מספר שלם").positive("המחיר חייב להיות גדול מ-0")
  ),
  rooms: requiredNumber(
    z
      .number({ error: "יש להזין מספר חדרים" })
      .positive("מספר החדרים חייב להיות גדול מ-0")
      .max(99, "מספר חדרים לא תקין")
      .refine((n) => Number.isInteger(n * 2), "מספר החדרים יכול להיות שלם או חצי (למשל 3.5)")
  ),
  area_sqm: optionalNumber(z.number({ error: "שטח לא תקין" }).int("שטח לא תקין").positive("שטח לא תקין")),
  floor: optionalNumber(z.number({ error: "קומה לא תקינה" }).int("קומה לא תקינה").min(-5, "קומה לא תקינה").max(200, "קומה לא תקינה")),
  has_parking: checkbox,
  has_elevator: checkbox,
  has_balcony: checkbox,
  has_safe_room: checkbox,
  has_storage: checkbox,
  condition: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.enum(PROPERTY_CONDITIONS).nullable()),
  description: optionalText,
  expected_rent: optionalNumber(
    z.number({ error: "שכר דירה לא תקין" }).int("שכר דירה לא תקין").nonnegative("שכר דירה לא תקין")
  ),
  estimated_yield: optionalNumber(
    z.number({ error: "תשואה לא תקינה" }).min(0, "תשואה לא תקינה").max(99.99, "התשואה חייבת להיות בין 0 ל-99.99")
  ),
  status: z.enum(PROPERTY_STATUSES, { error: "יש לבחור סטטוס" }),
});

export type PropertyInput = z.infer<typeof propertySchema>;
export type PropertyFieldErrors = Partial<Record<keyof PropertyInput | "images", string>>;

const FIELD_NAMES = Object.keys(propertySchema.shape) as (keyof PropertyInput)[];

/** Reads the property fields from FormData (missing checkboxes = false). */
export function propertyFormValues(formData: FormData): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const name of FIELD_NAMES) {
    const value = formData.get(name);
    values[name] = typeof value === "string" ? value : value === null ? undefined : value;
  }
  return values;
}

export function parseProperty(
  values: Record<string, unknown>
): { success: true; data: PropertyInput } | { success: false; fieldErrors: PropertyFieldErrors } {
  const result = propertySchema.safeParse(values);
  if (result.success) return { success: true, data: result.data };

  const fieldErrors: PropertyFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof PropertyInput;
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { success: false, fieldErrors };
}
