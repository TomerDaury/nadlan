import Link from "next/link";
import { PropertyImage } from "@/components/property/property-image";
import { Button } from "@/components/ui/button";
import { FeatureTag } from "@/components/ui/feature-tag";
import { TintBox } from "@/components/ui/tint-box";
import { formatPrice, propertyDetails } from "@/lib/format";
import type { MatchCard } from "@/lib/services/requests";
import { FEATURE_FIELDS } from "@/lib/validation/property";

type PropertyCardProps = {
  match: MatchCard;
  href: string;
};

// DESIGN.md §1.2 / §2.3 — property card on the results screen.
export function PropertyCard({ match, href }: PropertyCardProps) {
  const { property } = match;
  const features = FEATURE_FIELDS.filter((f) => property[f.name]);

  return (
    <article className="flex flex-col overflow-hidden rounded-card bg-white shadow-card">
      <div className="relative aspect-[3/2] overflow-hidden rounded-t-card">
        <PropertyImage path={property.primaryImage} alt={property.title} sizes="(min-width: 768px) 33vw, 100vw" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2 className="text-h3 font-medium text-ink">{property.title}</h2>
          <p dir="ltr" className="text-end text-[20px] leading-7 font-semibold text-ink">
            {formatPrice(property.price)}
          </p>
          <p className="mt-1 text-small text-slate-text">{propertyDetails(property).join(" · ")}</p>
        </div>

        {features.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="מאפיינים">
            {features.map((f) => (
              <li key={f.name}>
                <FeatureTag>{f.label}</FeatureTag>
              </li>
            ))}
          </ul>
        )}

        <TintBox title="למה זה מתאים לכם" className="flex-1">
          {match.reason}
        </TintBox>

        <Button asChild variant="secondary" size="sm" className="w-full">
          <Link href={href}>לפרטים</Link>
        </Button>
      </div>
    </article>
  );
}
