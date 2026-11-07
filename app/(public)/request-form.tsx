"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { AreaFields, BudgetRoomsFields, PreferencesField } from "@/components/request/criteria-fields";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import type { Area } from "@/lib/services/areas";
import {
  parseRequest,
  requestFormValues,
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
            <AreaFields
              areas={areas}
              city={city}
              neighborhoods={neighborhoods}
              errors={errors}
              onCityChange={(value) => {
                setCity(value);
                setNeighborhoods([]);
                markEdited("neighborhoods");
              }}
              onNeighborhoodsChange={(value) => {
                setNeighborhoods(value);
                markEdited("neighborhoods");
              }}
            />
            <BudgetRoomsFields errors={errors} />
          </div>
        </div>

        <PreferencesField errors={errors} className="mt-6" />

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
