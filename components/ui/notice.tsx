import * as React from "react";
import { cn } from "@/lib/utils";
import { Mail, type LucideIcon } from "lucide-react";

type NoticeProps = React.ComponentProps<"div"> & {
  icon?: LucideIcon;
};

// Info notice: #FFF8F2 background, #FFD2AE border, orange icon, radius 10.
function Notice({ icon: Icon = Mail, className, children, ...props }: NoticeProps) {
  return (
    <div
      role="status"
      data-slot="notice"
      className={cn(
        "inline-flex items-center gap-2 rounded-input border border-notice-border bg-notice-bg px-4 py-2.5 text-small text-ink",
        className
      )}
      {...props}
    >
      <Icon aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-brand-500" />
      <span>{children}</span>
    </div>
  );
}

export { Notice };
