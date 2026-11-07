import { z } from "zod";

// Client request form schema (PRD F1). Shared by the browser form and the server action.

/** Rooms options for the "מ-" / "עד" selects: 1 to 10 in half steps. */
export const ROOM_OPTIONS = Array.from({ length: 19 }, (_, i) => 1 + i * 0.5);

export const MAX_BUDGET = 1_000_000_000;

const requiredText = (message: string, max: number, tooLong: string) =>
  z.string({ error: message }).trim().min(1, message).max(max, tooLong);

/** Required number from a form field: empty → undefined, so the schema's own "required" message shows. */
const requiredNumber = (schema: z.ZodType<number>) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)), schema);

const rooms = (message: string) =>
  requiredNumber(
    z
      .number({ error: message })
      .min(1, "מספר חדרים לא תקין")
      .max(10, "מספר חדרים לא תקין")
      .refine((n) => Number.isInteger(n * 2), "מספר החדרים יכול להיות שלם או חצי (למשל 3.5)")
  );

// Digits, spaces and dashes, optional leading "+", 9–15 digits in total.
const PHONE_PATTERN = /^\+?[\d\s-]+$/;

const requestFields = z.object({
  submission_id: z.uuid({ error: "השליחה נכשלה. רעננו את הדף ונסו שוב." }),
  name: requiredText("יש להזין שם מלא", 100, "השם ארוך מדי"),
  email: z
    .string({ error: "יש להזין אימייל" })
    .trim()
    .min(1, "יש להזין אימייל")
    .max(254, "כתובת האימייל אינה תקינה")
    .pipe(z.email({ error: "כתובת האימייל אינה תקינה" }))
    .transform((v) => v.toLowerCase()),
  // Optional: missing or empty → null.
  phone: z.preprocess(
    (v) => v ?? "",
    z
      .string()
      .trim()
      .refine((v) => {
        if (v === "") return true;
        const digits = v.replace(/\D/g, "").length;
        return PHONE_PATTERN.test(v) && digits >= 9 && digits <= 15;
      }, "מספר הטלפון אינו תקין")
      .transform((v) => (v === "" ? null : v))
  ),
  city: requiredText("יש לבחור עיר", 100, "יש לבחור עיר"),
  neighborhoods: z
    .array(z.string().trim().min(1))
    .min(1, "יש לבחור לפחות שכונה אחת")
    .max(50, "יש לבחור שכונות מהרשימה")
    .transform((list) => [...new Set(list)]),
  max_budget: requiredNumber(
    z
      .number({ error: "יש להזין תקציב" })
      .int("התקציב חייב להיות מספר שלם")
      .positive("התקציב חייב להיות גדול מ-0")
      .max(MAX_BUDGET, "התקציב גבוה מדי")
  ),
  rooms_min: rooms("יש לבחור מספר חדרים מינימלי"),
  rooms_max: rooms("יש לבחור מספר חדרים מקסימלי"),
  preferences_text: requiredText("ספרו לנו מה הכי חשוב לכם בנכס", 1000, "הטקסט ארוך מדי (עד 1,000 תווים)"),
});

const roomsRange = requestFields.pick({ rooms_min: true, rooms_max: true });

const roomsOrder = {
  path: ["rooms_max"],
  message: "מספר החדרים המינימלי גדול מהמקסימלי",
  // Check the range even when other fields have errors, so all messages show at once.
  when: (payload: { value: unknown }) => roomsRange.safeParse(payload.value).success,
};

export const requestSchema = requestFields.refine((v) => v.rooms_min <= v.rooms_max, roomsOrder);

/** "עדכון הקריטריונים" (PRD F5): the request fields without the personal details. */
export const criteriaSchema = requestFields
  .pick({ city: true, neighborhoods: true, max_budget: true, rooms_min: true, rooms_max: true, preferences_text: true })
  .refine((v) => v.rooms_min <= v.rooms_max, roomsOrder);

export type RequestInput = z.infer<typeof requestSchema>;
export type CriteriaInput = z.infer<typeof criteriaSchema>;
export type RequestField = keyof RequestInput;
export type RequestFieldErrors = Partial<Record<RequestField, string>>;

/** Search criteria part of a request (used by the matching engine). */
export type Criteria = Pick<RequestInput, "city" | "neighborhoods" | "max_budget" | "rooms_min" | "rooms_max">;

const SINGLE_FIELDS = [
  "submission_id",
  "name",
  "email",
  "phone",
  "city",
  "max_budget",
  "rooms_min",
  "rooms_max",
  "preferences_text",
] as const;

/** Reads the request fields from FormData. Neighborhoods are sent as repeated fields. */
export function requestFormValues(formData: FormData): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const name of SINGLE_FIELDS) {
    const value = formData.get(name);
    values[name] = typeof value === "string" ? value : undefined;
  }
  values.neighborhoods = formData.getAll("neighborhoods").filter((v): v is string => typeof v === "string");
  return values;
}

type ParseResult<T> = { success: true; data: T } | { success: false; fieldErrors: RequestFieldErrors };

function parseWith<T>(schema: z.ZodType<T>, values: Record<string, unknown>): ParseResult<T> {
  const result = schema.safeParse(values);
  if (result.success) return { success: true, data: result.data };

  const fieldErrors: RequestFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as RequestField;
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { success: false, fieldErrors };
}

export function parseRequest(values: Record<string, unknown>): ParseResult<RequestInput> {
  return parseWith(requestSchema, values);
}

/** Same form reader (requestFormValues) — the personal fields are simply absent and ignored. */
export function parseCriteria(values: Record<string, unknown>): ParseResult<CriteriaInput> {
  return parseWith(criteriaSchema, values);
}

/** Closed-list check (server side): the city and every neighborhood must exist in available_areas. */
export function isInAreas(
  criteria: Pick<RequestInput, "city" | "neighborhoods">,
  areas: { city: string; neighborhoods: string[] }[]
): boolean {
  const area = areas.find((a) => a.city === criteria.city);
  return Boolean(area) && criteria.neighborhoods.every((n) => area!.neighborhoods.includes(n));
}
