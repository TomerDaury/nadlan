import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { fieldBaseClass } from "@/components/ui/input";

type SelectProps = React.ComponentProps<"select"> & {
  /** Shown as an empty, disabled first option (e.g. "בחרו עיר"). */
  placeholder?: string;
};

// Native <select> styled like the other fields; chevron on the left (RTL end).
function Select({ className, placeholder, children, defaultValue, value, ...props }: SelectProps) {
  const isControlled = value !== undefined;

  return (
    <div className={cn("relative w-full", className)}>
      <select
        data-slot="select"
        className={cn(
          fieldBaseClass,
          "h-[46px] cursor-pointer appearance-none pe-10 has-[option[value='']:checked]:text-muted-text"
        )}
        {...(isControlled ? { value } : { defaultValue: defaultValue ?? (placeholder ? "" : undefined) })}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown
        aria-hidden
        strokeWidth={1.75}
        className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-text"
      />
    </div>
  );
}

export { Select };
