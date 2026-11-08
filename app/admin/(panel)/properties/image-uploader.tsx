"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { IMAGE_TYPES, MAX_IMAGES, validateNewImages } from "@/lib/validation/images";

export type ImageItem = {
  /** Stable key: the storage path once uploaded, otherwise a temporary id. */
  key: string;
  /** Storage path; null until the file is uploaded on save. */
  path: string | null;
  /** Preview URL (public URL or local blob URL). */
  url: string;
  /** Local file waiting to be uploaded. */
  file?: File;
};

type ImageUploaderProps = {
  items: ImageItem[];
  primaryKey: string | null;
  error?: string;
  disabled?: boolean;
  onChange: (items: ImageItem[], primaryKey: string | null) => void;
};

// DESIGN.md §1.8 — dashed orange drop zone + 3-column thumbnail grid; primary marked "ראשית".
export function ImageUploader({ items, primaryKey, error, disabled, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const shownError = localError ?? error;

  function addFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    const validationError = validateNewImages(files, items.length);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(undefined);
    const added: ImageItem[] = files.map((file) => ({
      key: `local-${crypto.randomUUID()}`,
      path: null,
      url: URL.createObjectURL(file),
      file,
    }));
    const next = [...items, ...added];
    onChange(next, primaryKey ?? next[0]?.key ?? null);
  }

  function remove(key: string) {
    const item = items.find((i) => i.key === key);
    if (item?.file) URL.revokeObjectURL(item.url);
    const next = items.filter((i) => i.key !== key);
    setLocalError(undefined);
    onChange(next, primaryKey === key ? (next[0]?.key ?? null) : primaryKey);
  }

  const full = items.length >= MAX_IMAGES;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={disabled || full}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        aria-describedby={shownError ? "images-error" : undefined}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-input border-[1.5px] border-dashed border-brand-500 bg-brand-50 px-4 py-6 text-center text-small text-brand-700 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50",
          dragging && "bg-brand-50/60 ring-3 ring-focus-ring"
        )}
      >
        <Icon name="upload" className="size-6 text-brand-500" />
        {full ? `הגעתם למקסימום של ${MAX_IMAGES} תמונות` : "גררו תמונות או לחצו להעלאה"}
        <span className="text-caption text-slate-text">JPG, PNG, WebP · עד 5MB לתמונה</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={Object.keys(IMAGE_TYPES).join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {shownError && (
        <p id="images-error" role="alert" className="text-caption text-error">
          {shownError}
        </p>
      )}

      {items.length > 0 && (
        <>
          <ul className="grid grid-cols-3 gap-2">
            {items.map((item) => {
              const isPrimary = item.key === primaryKey;
              return (
                <li key={item.key} className="relative">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(items, item.key)}
                    aria-label={isPrimary ? "תמונה ראשית" : "הגדרה כתמונה ראשית"}
                    aria-pressed={isPrimary}
                    className={cn(
                      "relative block aspect-[3/2] w-full overflow-hidden rounded-menu border-2 outline-none focus-visible:ring-3 focus-visible:ring-focus-ring",
                      isPrimary ? "border-brand-500" : "border-transparent"
                    )}
                  >
                    <Image
                      src={item.url}
                      alt=""
                      fill
                      sizes="120px"
                      unoptimized={Boolean(item.file)}
                      className="object-cover"
                    />
                    {isPrimary && (
                      <Badge variant="primary" className="absolute start-1 bottom-1 h-5 px-1.5">
                        ראשית
                      </Badge>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => remove(item.key)}
                    aria-label="הסרת תמונה"
                    className="absolute -top-1.5 -end-1.5 flex size-5 items-center justify-center rounded-full border border-line bg-white text-slate-text shadow-card hover:text-error"
                  >
                    <X className="size-3" strokeWidth={2.5} />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-caption text-slate-text">לחצו על תמונה כדי להגדיר אותה כתמונה הראשית.</p>
        </>
      )}
    </div>
  );
}
