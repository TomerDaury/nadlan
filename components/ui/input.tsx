import * as React from "react";
import { cn } from "@/lib/utils";

// Shared field look (DESIGN.md §2.3): white, 1.5px #D6D6D6 border, radius 10,
// orange border + 3px #FFE3CC ring on focus, red border when invalid.
export const fieldBaseClass =
  "w-full min-w-0 rounded-input border-[1.5px] border-input-border bg-white px-3.5 text-body text-ink transition-colors outline-none placeholder:text-muted-text focus-visible:border-brand-500 focus-visible:ring-3 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-mist disabled:text-muted-text aria-invalid:border-error aria-invalid:focus-visible:ring-error/15";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldBaseClass, "h-[46px]", className)}
      {...props}
    />
  );
}

export { Input };
