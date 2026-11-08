import { cn } from "cn";
import { LogoMark } from "@/components/layout/logo-mark";

type LogoProps = {
  /** Text next to the mark. "לוגו" is the design's placeholder for the business name. */
  label?: string;
  className?: string;
};

// Rounded orange square with the white logo mark (a house in front of a sun), followed by a label.
export function Logo({ label = "לוגו", className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-8 items-center justify-center rounded-menu bg-brand-500 text-white">
        <LogoMark className="size-[22px]" />
      </span>
      <span className="text-body font-medium text-ink">{label}</span>
    </span>
  );
}
