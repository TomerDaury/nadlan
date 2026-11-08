import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldBaseClass } from "@/components/ui/input";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBaseClass, "block min-h-[84px] resize-y py-3", className)}
      {...props}
    />
  );
}

export { Textarea };
