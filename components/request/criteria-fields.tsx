"use client";

import { ChipGroup } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Area } from "@/lib/services/areas";
import { ROOM_OPTIONS, type RequestFieldErrors } from "@/lib/validation/request";

// Search-criteria fields shared by the request form (DESIGN §1.1) and the criteria update
// screen (§1.5). The parent form owns the city and neighborhood state and the hidden inputs.

type AreaFieldsProps = {
  areas: Area[];
  city: string;
  neighborhoods: string[];
  errors: RequestFieldErrors;
  onCityChange: (city: string) => void;
  onNeighborhoodsChange: (neighborhoods: string[]) => void;
};

/** City select + neighborhood chips (multi-select). */
export function AreaFields({ areas, city, neighborhoods, errors, onCityChange, onNeighborhoodsChange }: AreaFieldsProps) {
  const cityNeighborhoods = areas.find((a) => a.city === city)?.neighborhoods ?? [];

  return (
    <>
      <Field id="city" label="עיר" required error={errors.city}>
        {(p) => (
          <Select {...p} name="city" placeholder="בחרו עיר" value={city} onChange={(e) => onCityChange(e.target.value)}>
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
          <ChipGroup label="שכונות" options={cityNeighborhoods} value={neighborhoods} onChange={onNeighborhoodsChange} />
        ) : (
          <p className="text-small text-muted-text">בחרו קודם עיר</p>
        )}
        {errors.neighborhoods && <p className="text-caption text-error">{errors.neighborhoods}</p>}
      </div>
    </>
  );
}

type BudgetRoomsFieldsProps = {
  errors: RequestFieldErrors;
  defaults?: { max_budget?: number; rooms_min?: number; rooms_max?: number };
};

/** Max budget + rooms range ("מ-" / "עד"). */
export function BudgetRoomsFields({ errors, defaults }: BudgetRoomsFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1.2fr]">
      <Field id="max_budget" label="תקציב מקסימלי (₪)" required error={errors.max_budget} className="col-span-2 lg:col-span-1">
        {(p) => (
          <Input
            {...p}
            name="max_budget"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            dir="ltr"
            className="text-end"
            placeholder="2,000,000"
            defaultValue={defaults?.max_budget}
          />
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
            defaultValue={defaults?.rooms_min === undefined ? undefined : String(defaults.rooms_min)}
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
            defaultValue={defaults?.rooms_max === undefined ? undefined : String(defaults.rooms_max)}
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
  );
}

/** "מה הכי חשוב לכם בנכס?" */
export function PreferencesField({
  errors,
  defaultValue,
  className,
}: {
  errors: RequestFieldErrors;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <Field id="preferences_text" label="מה הכי חשוב לכם בנכס?" required error={errors.preferences_text} className={className}>
      {(p) => (
        <Textarea
          {...p}
          name="preferences_text"
          rows={3}
          maxLength={1000}
          placeholder="למשל: שקט, קרוב לגנים, עם מרפסת..."
          defaultValue={defaultValue}
        />
      )}
    </Field>
  );
}
