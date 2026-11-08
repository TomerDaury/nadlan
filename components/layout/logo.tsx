import { cn } from "cn";
import { LogoMark } from "@/components/layout/logo-mark";

type LogoProps = {
  /** Optional text next to the mark (the admin header shows "ממשק ניהול"). The client site shows the mark only. */
  label?: string;
  className?: string;
};

// Rounded orange square with the white logo mark (a house in front of a sun), optionally followed by a label.
export function Logo({ label, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-8 items-center justify-center rounded-menu bg-brand-500 text-white">
        <LogoMark className="size-[22px]" />
      </span>
      {label && <span className="text-body font-medium text-ink">{label}</span>}
    </span>
  );
}
