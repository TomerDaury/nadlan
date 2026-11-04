"use client";

import * as React from "react";
import { cn } from "cn";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("flex flex-wrap gap-4", className)}
      {...props}
    />
  );
}

// 16px circle; selected = thick orange ring.
function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer relative flex aspect-square size-4 shrink-0 rounded-full border-[1.5px] border-input-border bg-white transition-[border] outline-none after:absolute after:-inset-2 focus-visible:ring-3 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error data-[state=checked]:border-[5px] data-[state=checked]:border-brand-500",
        className
      )}
      {...props}
    />
  );
}

export { RadioGroup, RadioGroupItem };
