import Link from "next/link";
import { cn } from "cn";
import { PropertyImage } from "@/components/property/property-image";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { NotificationMatch } from "@/lib/services/requests";

// DESIGN.md §1.4 — one row in "נכסים חדשים שנשלחו אליי": thumbnail, title, neighborhood and
// price, and a "לפרטים" link. A property that is no longer available gets a "לא זמין" tag.
export function NotificationRow({ match, href }: { match: NotificationMatch; href: string }) {
  const { property } = match;
  const unavailable = property.status !== "available";

  return (
    <li className="flex items-center gap-4 border-b border-row-divider py-3 first:pt-0 last:border-b-0 last:pb-0">
      <Link href={href} tabIndex={-1} aria-hidden className="relative size-16 shrink-0 overflow-hidden rounded-lg">
        <PropertyImage path={property.primaryImage} alt="" sizes="64px" className={cn(unavailable && "grayscale")} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cn("truncate text-body font-medium", unavailable ? "text-muted-text" : "text-ink")}>{property.title}</h3>
          {unavailable && <Badge variant="neutral">לא זמין</Badge>}
        </div>
        <p className={cn("text-small", unavailable ? "text-muted-text" : "text-slate-text")}>
          {property.neighborhood} • <span dir="ltr">{formatPrice(property.price)}</span>
        </p>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-menu text-small font-medium text-brand-600 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring"
      >
        לפרטים
      </Link>
    </li>
  );
}
