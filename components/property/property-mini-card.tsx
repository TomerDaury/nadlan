import Link from "next/link";
import { cn } from "cn";
import { PropertyImage } from "@/components/property/property-image";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { MatchCard } from "@/lib/services/requests";

// DESIGN.md §1.4 — small card on the personal page: image, title and price.
// A property that is no longer available gets a "לא זמין" tag and grey text.
export function PropertyMiniCard({ match, href }: { match: MatchCard; href: string }) {
  const { property } = match;
  const unavailable = property.status !== "available";

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-card bg-white shadow-card outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <PropertyImage
          path={property.primaryImage}
          alt={property.title}
          sizes="(min-width: 768px) 25vw, 100vw"
          className={cn(unavailable && "grayscale")}
        />
        {unavailable && (
          <Badge variant="neutral" className="absolute start-3 top-3 bg-white">
            לא זמין
          </Badge>
        )}
      </div>
      <div className={cn("flex flex-col gap-0.5 p-4", unavailable && "text-muted-text")}>
        <h3 className={cn("text-body font-medium group-hover:underline", unavailable ? "text-muted-text" : "text-ink")}>
          {property.title}
        </h3>
        <p dir="ltr" className={cn("text-end text-body font-semibold", unavailable ? "text-muted-text" : "text-ink")}>
          {formatPrice(property.price)}
        </p>
      </div>
    </Link>
  );
}
