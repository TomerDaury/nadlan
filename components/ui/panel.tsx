import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

// Panel: white, radius 14, card shadow. "muted" = grey panel (e.g. investment data).
const panelVariants = cva("", {
  variants: {
    variant: {
      default: "rounded-card bg-white shadow-card",
      large: "rounded-panel-lg bg-white shadow-card",
      muted: "rounded-card bg-mist",
    },
    padding: {
      default: "p-6",
      none: "",
    },
  },
  defaultVariants: { variant: "default", padding: "default" },
});

function Panel({
  className,
  variant,
  padding,
  ...props
}: React.ComponentProps<"section"> & VariantProps<typeof panelVariants>) {
  return <section data-slot="panel" className={cn(panelVariants({ variant, padding }), className)} {...props} />;
}

export { Panel };
