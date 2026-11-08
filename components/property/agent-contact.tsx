import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { phoneHref, whatsappHref } from "@/lib/contact";

// DESIGN.md §1.3 / PRD F10 — contact the agent from the property details screen:
// Primary "התקשרו לסוכן" (phone call) and Secondary "WhatsApp" (chat with a ready message).
// Two equal columns, so on mobile each button fills half the row.
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
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <Button asChild>
        <a href={phoneHref(phone)}>
          <Icon name="phone" />
          התקשרו לסוכן
        </a>
      </Button>
      <Button asChild variant="secondary">
        <a href={whatsappHref(phone, property)} target="_blank" rel="noopener noreferrer">
          <Icon name="message" />
          WhatsApp
        </a>
      </Button>
    </div>
  );
}
