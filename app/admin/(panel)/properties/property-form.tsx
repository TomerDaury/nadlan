"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/integrations/supabase/browser";
import { publicImageUrl } from "@/lib/images";
import { buildImagePath, IMAGE_BUCKET } from "@/lib/validation/images";
import {
  CONDITION_LABELS,
  FEATURE_FIELDS,
  PROPERTY_CONDITIONS,
  type PropertyFieldErrors,
} from "@/lib/validation/property";
import type { Property } from "@/lib/services/properties";
import {
  createPropertyAction,
  updatePropertyAction,
  type PropertyFormState,
} from "@/app/admin/(panel)/properties/actions";
import { ImageUploader, type ImageItem } from "@/app/admin/(panel)/properties/image-uploader";

type PropertyFormProps =
  | { mode: "create"; propertyId: string; property?: undefined }
  | { mode: "edit"; propertyId: string; property: Property };

const UPLOAD_FAILED = "העלאת התמונות נכשלה. בדקו את הקבצים ונסו שוב.";

function initialImages(property?: Property): { items: ImageItem[]; primaryKey: string | null } {
  const items = (property?.images ?? []).map((image) => ({
    key: image.storage_path,
    path: image.storage_path,
    url: publicImageUrl(image.storage_path),
  }));
  const primary = property?.images.find((i) => i.is_primary)?.storage_path ?? items[0]?.key ?? null;
  return { items, primaryKey: primary };
}

const str = (value: number | string | null | undefined) => (value === null || value === undefined ? "" : String(value));

// DESIGN.md §1.8 — one screen for "הוספת נכס" and "עריכת נכס".
export function PropertyForm({ mode, propertyId, property }: PropertyFormProps) {
  const action = mode === "create" ? createPropertyAction : updatePropertyAction;
  const [state, dispatch, saving] = useActionState<PropertyFormState, FormData>(action, {});
  const [images, setImages] = useState(() => initialImages(property));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const busy = saving || uploading;
  const errors: PropertyFieldErrors = state.fieldErrors ?? {};

  /** Uploads new files to Storage; returns the list with storage paths filled in. */
  async function uploadPending(items: ImageItem[]): Promise<ImageItem[] | null> {
    const pending = items.filter((i) => i.file && !i.path);
    if (!pending.length) return items;

    const supabase = createClient();
    const uploaded = new Map<string, string>();
    for (const item of pending) {
      const path = buildImagePath(propertyId, item.file!.type, crypto.randomUUID());
      const { error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, item.file!, { contentType: item.file!.type, upsert: false });
      if (error) {
        // Roll back files uploaded in this attempt.
        if (uploaded.size) await supabase.storage.from(IMAGE_BUCKET).remove([...uploaded.values()]);
        return null;
      }
      uploaded.set(item.key, path);
    }
    // Keep the uploaded paths so a retry after a validation error does not upload again.
    return items.map((i) => (uploaded.has(i.key) ? { ...i, path: uploaded.get(i.key)!, file: undefined } : i));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Built manually (not <form action>) so React does not reset the fields on a validation error.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setUploadError(undefined);
    setUploading(true);
    const items = await uploadPending(images.items);
    setUploading(false);
    if (!items) {
      setUploadError(UPLOAD_FAILED);
      return;
    }

    const primaryItem = items.find((i) => i.key === images.primaryKey) ?? items[0];
    setImages({ items, primaryKey: primaryItem?.key ?? null });

    formData.set("id", propertyId);
    formData.set("images", JSON.stringify(items.map((i) => i.path)));
    formData.set("primary_image", primaryItem?.path ?? "");
    startTransition(() => dispatch(formData));
  }

  const title = mode === "create" ? "הוספת נכס" : "עריכת נכס";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h2 font-medium">{title}</h1>
        <div className="flex gap-3">
          <Button asChild variant="neutral" size="sm">
            <Link href="/admin/properties">ביטול</Link>
          </Button>
          <Button type="submit" size="sm" disabled={busy}>
            {uploading ? "מעלה תמונות..." : saving ? "שומר..." : "שמירה"}
          </Button>
        </div>
      </div>

      {(state.formError || uploadError) && (
        <p role="alert" className="mb-4 rounded-input bg-error/10 px-4 py-2.5 text-small text-error">
          {uploadError ?? state.formError}
        </p>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Right (RTL start): property fields */}
        <Panel className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="title" label="כותרת" required error={errors.title}>
              {(p) => <Input {...p} name="title" defaultValue={property?.title} />}
            </Field>
            <Field id="address" label="כתובת" error={errors.address}>
              {(p) => <Input {...p} name="address" defaultValue={str(property?.address)} />}
            </Field>
            <Field id="city" label="עיר" required error={errors.city}>
              {(p) => <Input {...p} name="city" defaultValue={property?.city} />}
            </Field>
            <Field id="neighborhood" label="שכונה" required error={errors.neighborhood}>
              {(p) => <Input {...p} name="neighborhood" defaultValue={property?.neighborhood} />}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field id="price" label="מחיר (₪)" required error={errors.price}>
              {(p) => (
                <Input {...p} name="price" type="number" inputMode="numeric" min={1} dir="ltr" defaultValue={str(property?.price)} />
              )}
            </Field>
            <Field id="rooms" label="חדרים" required error={errors.rooms}>
              {(p) => (
                <Input {...p} name="rooms" type="number" inputMode="decimal" min={0.5} step={0.5} dir="ltr" defaultValue={str(property?.rooms)} />
              )}
            </Field>
            <Field id="area_sqm" label='שטח (מ"ר)' error={errors.area_sqm}>
              {(p) => (
                <Input {...p} name="area_sqm" type="number" inputMode="numeric" min={1} dir="ltr" defaultValue={str(property?.area_sqm)} />
              )}
            </Field>
            <Field id="floor" label="קומה" error={errors.floor}>
              {(p) => <Input {...p} name="floor" type="number" inputMode="numeric" dir="ltr" defaultValue={str(property?.floor)} />}
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2.5 text-small font-medium text-ink">מאפיינים</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {FEATURE_FIELDS.map((feature) => (
                <div key={feature.name} className="flex items-center gap-2">
                  <Checkbox id={feature.name} name={feature.name} defaultChecked={property?.[feature.name] ?? false} />
                  <Label htmlFor={feature.name} className="font-normal">
                    {feature.label}
                  </Label>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="condition" label="מצב הנכס" error={errors.condition}>
              {(p) => (
                <Select {...p} name="condition" defaultValue={property?.condition ?? ""}>
                  <option value="">לא צוין</option>
                  {PROPERTY_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {CONDITION_LABELS[c]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field id="expected_rent" label="שכר דירה צפוי (₪)" error={errors.expected_rent}>
              {(p) => (
                <Input {...p} name="expected_rent" type="number" inputMode="numeric" min={0} dir="ltr" defaultValue={str(property?.expected_rent)} />
              )}
            </Field>
            <Field id="estimated_yield" label="תשואה משוערת (%)" error={errors.estimated_yield}>
              {(p) => (
                <Input {...p} name="estimated_yield" type="number" inputMode="decimal" min={0} max={99.99} step={0.01} dir="ltr" defaultValue={str(property?.estimated_yield)} />
              )}
            </Field>
          </div>

          <Field id="description" label="תיאור הנכס והסביבה" error={errors.description}>
            {(p) => <Textarea {...p} name="description" rows={5} defaultValue={str(property?.description)} />}
          </Field>
        </Panel>

        {/* Left (RTL end): status + images */}
        <Panel className="flex w-full flex-col gap-6 lg:w-[320px] lg:shrink-0">
          <fieldset>
            <legend className="mb-2.5 text-small font-medium text-ink">
              סטטוס
              <span aria-hidden className="text-brand-500">
                *
              </span>
            </legend>
            <RadioGroup name="status" defaultValue={property?.status ?? "available"} aria-label="סטטוס">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="status-available" value="available" />
                <Label htmlFor="status-available" className="font-normal">
                  זמין
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="status-unavailable" value="unavailable" />
                <Label htmlFor="status-unavailable" className="font-normal">
                  לא זמין
                </Label>
              </div>
            </RadioGroup>
            {errors.status && <p className="mt-1.5 text-caption text-error">{errors.status}</p>}
          </fieldset>

          <div>
            <p className="mb-2.5 text-small font-medium text-ink">תמונות (עד 10)</p>
            <ImageUploader
              items={images.items}
              primaryKey={images.primaryKey}
              error={errors.images}
              disabled={busy}
              onChange={(items, primaryKey) => setImages({ items, primaryKey })}
            />
          </div>
        </Panel>
      </div>
    </form>
  );
}
