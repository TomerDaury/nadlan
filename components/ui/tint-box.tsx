import * as React from "react";
import { cn } from "cn";

type TintBoxProps = React.ComponentProps<"div"> & {
  title: string;
};

// Orange 50 box with an Orange 700 title — "למה זה מתאים לכם" / "מה חשוב ללקוח".
function TintBox({ title, className, children, ...props }: TintBoxProps) {
  return (
    <div data-slot="tint-box" className={cn("rounded-input bg-brand-50 p-4", className)} {...props}>
      <p className="mb-1 text-small font-medium text-brand-700">{title}</p>
      <div className="text-small text-ink">{children}</div>
    </div>
  );
}

export { TintBox };
