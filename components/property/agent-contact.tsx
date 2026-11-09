import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { displayPhone, phoneHref, whatsappHref } from "@/lib/contact";

// DESIGN.md §1.3 / PRD F10 — contact the agent from the property details screen:
// the agent's phone number as text (tappable on a phone) and a Secondary "WhatsApp" button
// that opens a chat with a ready message about the property.
export function AgentContact({
  phone,
  property,
  className,
}: {
  /** International digits, from normalizePhone(). */
  phone: string;
  property: { title: string; neighborhood: string; city: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-3", className)}>
      <p className="flex items-center gap-2 text-body text-ink">
        <Icon name="phone" className="size-5 text-brand-500" />
        <span className="text-slate-text">טלפון הסוכן:</span>
        <a
          href={phoneHref(phone)}
          dir="ltr"
          className="rounded-menu font-medium text-ink outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring"
        >
          {displayPhone(phone)}
        </a>
      </p>
      <Button asChild variant="secondary">
        <a href={whatsappHref(phone, property)} target="_blank" rel="noopener noreferrer">
          <Icon name="message" />
          WhatsApp
        </a>
      </Button>
    </div>
  );
}
