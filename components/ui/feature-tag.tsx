import * as React from "react";
import { cn } from "@/lib/utils";

type FeatureTagProps = React.ComponentProps<"span"> & {
  /** Prefix the text with a ✓ mark. */
  check?: boolean;
};

// Property feature tag: white, Line border, radius 6.
function FeatureTag({ check, className, children, ...props }: FeatureTagProps) {
  return (
    <span
      data-slot="feature-tag"
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-tag border border-line bg-white px-2.5 text-caption text-ink",
        className
      )}
      {...props}
    >
      {check && <span aria-hidden>✓</span>}
      {children}
    </span>
  );
}

export { FeatureTag };
