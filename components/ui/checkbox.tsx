"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check } from "lucide-react";

// 16px square; checked = orange fill with a white check mark.
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-input-border bg-white transition-colors outline-none after:absolute after:-inset-x-2 after:-inset-y-2 focus-visible:border-brand-500 focus-visible:ring-3 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500 data-[state=checked]:text-white",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-content-center">
        <Check strokeWidth={3} className="size-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
