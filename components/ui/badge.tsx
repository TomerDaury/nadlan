import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

// Status badges (DESIGN.md §2.3): radius 6, 12px Medium.
const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-tag px-2 text-caption font-medium whitespace-nowrap [&>svg]:size-3",
  {
    variants: {
      variant: {
        success: "bg-success-bg text-success", // "זמין" / "פעיל"
        neutral: "bg-mist text-slate-text", // "לא זמין" / "לא פעיל"
        rank: "min-w-6 bg-brand-50 text-brand-700", // ranking number
        primary: "bg-brand-500 text-white", // "ראשית"
        tint: "bg-brand-50 text-brand-700", // e.g. "עדכונים פעילים"
        new: "bg-accent-purple text-white", // "חדש"
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
