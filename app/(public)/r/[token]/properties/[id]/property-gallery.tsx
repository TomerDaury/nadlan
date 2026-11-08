"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PropertyImage } from "@/components/property/property-image";

type PropertyGalleryProps = {
  title: string;
  /** Storage paths, primary image first. */
  images: string[];
};

// DESIGN.md §1.3 — large photo with a "1 / 6" counter and thumbnails; a thumbnail swaps the photo.
export function PropertyGallery({ title, images }: PropertyGalleryProps) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[3/2] overflow-hidden rounded-card bg-mist">
        <PropertyImage
          path={images[current] ?? null}
          alt={images.length ? `${title} – תמונה ${current + 1}` : title}
          sizes="(min-width: 1024px) 600px, 100vw"
          priority
        />
        {images.length > 0 && (
          <span
            dir="ltr"
            className="absolute bottom-3 left-3 rounded-tag bg-black/60 px-2 py-0.5 text-caption font-medium text-white"
          >
            {current + 1} / {images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-2" aria-label="תמונות הנכס">
          {images.map((path, index) => (
            <li key={path}>
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`תמונה ${index + 1}`}
                aria-current={index === current}
                className={cn(
                  "relative block aspect-[3/2] w-full overflow-hidden rounded-input border-2 outline-none focus-visible:ring-3 focus-visible:ring-focus-ring",
                  index === current ? "border-brand-500" : "border-transparent hover:border-line"
                )}
              >
                <PropertyImage path={path} alt="" sizes="150px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
