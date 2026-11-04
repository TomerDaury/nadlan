import * as React from "react";
import { cn } from "cn";
import { Label } from "@/components/ui/label";

type FieldProps = {
  /** Id of the control inside; links the label and the error message. */
  id: string;
  label: string;
  required?: boolean;
  /** Validation message shown under the control, in Error color. */
  error?: string;
  className?: string;
  /** Receives aria props to spread onto the control. */
  children: (control: {
    id: string;
    "aria-invalid"?: true;
    "aria-describedby"?: string;
    required?: boolean;
  }) => React.ReactNode;
};

// Label above the control, orange required asterisk, error text below.
function Field({ id, label, required, error, className, children }: FieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden className="text-brand-500">
            *
          </span>
        )}
      </Label>
      {children({
        id,
        required,
        ...(error ? { "aria-invalid": true as const, "aria-describedby": errorId } : {}),
      })}
      {error && (
        <p id={errorId} className="text-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export { Field };
