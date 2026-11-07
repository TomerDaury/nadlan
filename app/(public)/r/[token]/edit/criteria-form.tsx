"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { AreaFields, BudgetRoomsFields, PreferencesField } from "@/components/request/criteria-fields";
import { Button } from "@/components/ui/button";
import type { Area } from "@/lib/services/areas";
import type { ClientRequest } from "@/lib/services/requests";
import { parseCriteria, requestFormValues, type RequestFieldErrors } from "@/lib/validation/request";
import type { CriteriaFormState } from "@/app/(public)/r/[token]/actions";

type CriteriaFormProps = {
  token: string;
  areas: Area[];
  request: ClientRequest;
  /** updateCriteriaAction bound to the token on the server, so the form also works before hydration. */
  action: (state: CriteriaFormState, formData: FormData) => Promise<CriteriaFormState>;
};

// DESIGN.md §1.5 — criteria update form, filled with the request's current values.
export function CriteriaForm({ token, areas, request, action }: CriteriaFormProps) {
  const [state, dispatch, pending] = useActionState<CriteriaFormState, FormData>(action, {});
  const [clientErrors, setClientErrors] = useState<RequestFieldErrors | null>(null);

  // A city or neighborhood with no available properties left is no longer on the closed list:
  // it starts unselected and the client picks again.
  const area = areas.find((a) => a.city === request.city);
  const [city, setCity] = useState(area ? request.city : "");
  const [neighborhoods, setNeighborhoods] = useState(
    area ? request.neighborhoods.filter((n) => area.neighborhoods.includes(n)) : []
  );

  const errors = clientErrors ?? (pending ? {} : (state.fieldErrors ?? {}));
  const formError = clientErrors ? "יש לתקן את השדות המסומנים" : pending ? undefined : state.formError;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Dispatched manually so React does not reset the fields on a validation error.
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    const parsed = parseCriteria(requestFormValues(formData));
    if (!parsed.success) {
      setClientErrors(parsed.fieldErrors);
      return;
    }
    setClientErrors(null);
    startTransition(() => dispatch(formData));
  }

  return (
    <form action={dispatch} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {neighborhoods.map((n) => (
        <input key={n} type="hidden" name="neighborhoods" value={n} />
      ))}

      <AreaFields
        areas={areas}
        city={city}
        neighborhoods={neighborhoods}
        errors={errors}
        onCityChange={(value) => {
          setCity(value);
          setNeighborhoods([]);
        }}
        onNeighborhoodsChange={setNeighborhoods}
      />
      <BudgetRoomsFields
        errors={errors}
        defaults={{ max_budget: request.max_budget, rooms_min: request.rooms_min, rooms_max: request.rooms_max }}
      />
      <PreferencesField errors={errors} defaultValue={request.preferences_text} />

      {formError && (
        <p role="alert" className="rounded-input bg-error/10 px-4 py-2.5 text-center text-small text-error">
          {formError}
        </p>
      )}

      <div className="mt-2 flex flex-col-reverse justify-center gap-3 sm:flex-row">
        <Button asChild variant="neutral">
          <Link href={`/r/${token}`}>ביטול</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              מעדכנים התאמות...
              <Icon name="spinner" className="animate-spin" />
            </>
          ) : (
            "שמירה ועדכון התאמות"
          )}
        </Button>
      </div>
    </form>
  );
}
