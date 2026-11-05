"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Area } from "@/lib/services/areas";
import {
  parseRequest,
  requestFormValues,
  ROOM_OPTIONS,
  type RequestFieldErrors,
} from "@/lib/validation/request";
import { submitRequestAction, type RequestFormState } from "@/app/(public)/actions";

type RequestFormProps = {
  areas: Area[];
  /** New id per page load; the server ignores a second submission with the same id. */
  submissionId: string;
};

function SectionTitle({ icon, children }: { icon: "user" | "search"; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-body font-medium text-ink">
      <Icon name={icon} className="size-5 text-brand-500" />
      {children}
    </h2>
  );
}

// DESIGN.md §1.1 — request form.
export function RequestForm({ areas, submissionId }: RequestFormProps) {
  const [state, dispatch, pending] = useActionState<RequestFormState, FormData>(submitRequestAction, {});
  const [clientErrors, setClientErrors] = useState<RequestFieldErrors | null>(null);
  const [city, setCity] = useState("");
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  // Fields edited since the last submit: their error message is hidden.
  const [edited, setEdited] = useState<ReadonlySet<string>>(new Set());
  const submitted = useRef(false);

  // A new server answer ends the submission (a successful one navigates away instead).
  useEffect(() => {
    submitted.current = false;
  }, [state]);

  const allErrors: RequestFieldErrors = clientErrors ?? state.fieldErrors ?? {};
  const errors = Object.fromEntries(
    Object.entries(allErrors).filter(([field]) => !edited.has(field))
  ) as RequestFieldErrors;
  const formError = clientErrors ? "יש לתקן את השדות המסומנים" : state.formError;
  // A duplicate answer means the first submission is still on its way to the results page.
  const busy = pending || Boolean(state.duplicate);
  const cityNeighborhoods = areas.find((a) => a.city === city)?.neighborhoods ?? [];

  function markEdited(...fields: string[]) {
    setEdited((prev) => new Set([...prev, ...fields]));
  }

  function handleChange(event: React.FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name;
    // The rooms message belongs to both selects.
    if (name === "rooms_min" || name === "rooms_max") markEdited("rooms_min", "rooms_max");
    else if (name) markEdited(name);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Dispatched manually (preventDefault) so React does not reset the fields on a validation error.
    event.preventDefault();
    if (busy || submitted.current) return;

    const formData = new FormData(event.currentTarget);
    setEdited(new Set());
    const parsed = parseRequest(requestFormValues(formData));
    if (!parsed.success) {
      setClientErrors(parsed.fieldErrors);
      return;
    }
    setClientErrors(null);
    submitted.current = true;
    startTransition(() => dispatch(formData));
  }

  return (
    <Panel variant="large" className="mx-auto max-w-[880px] px-5 py-8 sm:px-12 sm:py-10">
      <div className="mb-8 text-center">
        <h1 className="text-h2 font-medium sm:text-h1">מצאו את הנכס שמתאים לכם</h1>
        <p className="mt-2 text-body text-slate-text">מלאו כמה פרטים ונציג לכם עד 3 נכסים מתאימים</p>
      </div>

      {/* action= makes an early submit (before the page is interactive) a POST to the server action,
          never a GET with personal details in the URL. After load, handleSubmit takes over. */}
      <form action={dispatch} onSubmit={handleSubmit} onChange={handleChange} noValidate>
        <input type="hidden" name="submission_id" value={submissionId} />
        {neighborhoods.map((n) => (
          <input key={n} type="hidden" name="neighborhoods" value={n} />
        ))}

        <div className="grid gap-8 md:grid-cols-2 md:gap-0">
          {/* Right (RTL start): personal details */}
          <div className="flex flex-col gap-4 md:border-e md:border-line md:pe-8">
            <SectionTitle icon="user">הפרטים שלכם</SectionTitle>
            <Field id="name" label="שם מלא" required error={errors.name}>
              {(p) => <Input {...p} name="name" autoComplete="name" placeholder="ישראל ישראלי" maxLength={100} />}
            </Field>
            <Field id="email" label="אימייל" required error={errors.email}>
              {(p) => (
                <Input {...p} name="email" type="email" autoComplete="email" dir="ltr" className="text-end" placeholder="name@example.com" />
              )}
            </Field>
            <Field id="phone" label="טלפון (רשות)" error={errors.phone}>
              {(p) => (
                <Input {...p} name="phone" type="tel" autoComplete="tel" dir="ltr" className="text-end" placeholder="050-0000000" />
              )}
            </Field>
          </div>

          {/* Left (RTL end): what they are looking for */}
          <div className="flex flex-col gap-4 md:ps-8">
            <SectionTitle icon="search">מה אתם מחפשים</SectionTitle>
            <Field id="city" label="עיר" required error={errors.city}>
              {(p) => (
                <Select
                  {...p}
                  name="city"
                  placeholder="בחרו עיר"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setNeighborhoods([]);
                    markEdited("neighborhoods");
                  }}
                >
                  {areas.map((a) => (
                    <option key={a.city} value={a.city}>
                      {a.city}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <div className="flex flex-col gap-1.5">
              <p id="neighborhoods-label" className="flex items-center gap-1 text-small font-medium text-ink">
                שכונות
                <span aria-hidden className="text-brand-500">
                  *
                </span>
              </p>
              {city ? (
                <ChipGroup
                  label="שכונות"
                  options={cityNeighborhoods}
                  value={neighborhoods}
                  onChange={(value) => {
                    setNeighborhoods(value);
                    markEdited("neighborhoods");
                  }}
                />
              ) : (
                <p className="text-small text-muted-text">בחרו קודם עיר</p>
              )}
              {errors.neighborhoods && <p className="text-caption text-error">{errors.neighborhoods}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1.2fr]">
              <Field id="max_budget" label="תקציב מקסימלי (₪)" required error={errors.max_budget} className="col-span-2 lg:col-span-1">
                {(p) => (
                  <Input {...p} name="max_budget" type="number" inputMode="numeric" min={1} step={1} dir="ltr" className="text-end" placeholder="2,000,000" />
                )}
              </Field>
              <fieldset className="col-span-2 flex flex-col gap-1.5 lg:col-span-1">
                <legend className="mb-1.5 flex items-center gap-1 text-small font-medium text-ink">
                  מספר חדרים
                  <span aria-hidden className="text-brand-500">
                    *
                  </span>
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <Label htmlFor="rooms_min" className="sr-only">
                    מספר חדרים מינימלי
                  </Label>
                  <Select
                    id="rooms_min"
                    name="rooms_min"
                    placeholder="מ-"
                    aria-invalid={errors.rooms_min ? true : undefined}
                  >
                    {ROOM_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                  <Label htmlFor="rooms_max" className="sr-only">
                    מספר חדרים מקסימלי
                  </Label>
                  <Select
                    id="rooms_max"
                    name="rooms_max"
                    placeholder="עד"
                    aria-invalid={errors.rooms_max ? true : undefined}
                  >
                    {ROOM_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </div>
                {(errors.rooms_min || errors.rooms_max) && (
                  <p className="text-caption text-error">{errors.rooms_min ?? errors.rooms_max}</p>
                )}
              </fieldset>
            </div>
          </div>
        </div>

        <Field id="preferences_text" label="מה הכי חשוב לכם בנכס?" required error={errors.preferences_text} className="mt-6">
          {(p) => (
            <Textarea {...p} name="preferences_text" rows={3} maxLength={1000} placeholder="למשל: שקט, קרוב לגנים, עם מרפסת..." />
          )}
        </Field>

        {formError && (
          <p role="alert" className="mt-5 rounded-input bg-error/10 px-4 py-2.5 text-center text-small text-error">
            {formError}
          </p>
        )}

        <div className="mt-6 flex justify-center">
          <Button type="submit" disabled={busy} className="w-full sm:w-auto sm:min-w-56">
            {busy ? (
              <>
                מחפשים עבורכם נכסים...
                <Icon name="spinner" className="animate-spin" />
              </>
            ) : (
              <>
                מצא לי נכסים
                <Icon name="search" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
