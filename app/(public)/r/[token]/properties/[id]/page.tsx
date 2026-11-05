import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { Icon, type IconName } from "@/components/icons";
import { InvalidLink } from "@/components/property/invalid-link";
import { FeatureTag } from "@/components/ui/feature-tag";
import { Panel } from "@/components/ui/panel";
import { formatPrice } from "@/lib/format";
import { getMatchedProperty, getRequestByToken } from "@/lib/services/requests";
import { CONDITION_LABELS, FEATURE_FIELDS } from "@/lib/validation/property";
import { PropertyGallery } from "@/app/(public)/r/[token]/properties/[id]/property-gallery";

type Params = PageProps<"/r/[token]/properties/[id]">["params"];

function StatCube({ icon, value, label }: { icon: IconName; value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-card border border-line bg-white px-2 py-3 text-center">
      <Icon name={icon} className="size-5 text-brand-500" />
      <span className="text-body font-medium text-ink">{value}</span>
      <span className="text-caption text-slate-text">{label}</span>
    </div>
  );
}

const dash = "–";

async function PropertyDetails({ params }: { params: Params }) {
  const { token, id } = await params;
  const request = await getRequestByToken(token);
  if (!request || !z.uuid().safeParse(id).success) return <InvalidLink />;

  // Only a property that was matched to this request may be shown (ARCHITECTURE §2.3).
  const property = await getMatchedProperty(request.id, id);
  if (!property) return <InvalidLink />;

  const features = FEATURE_FIELDS.filter((f) => property[f.name]);
  const location = [property.address, property.neighborhood, property.city].filter(Boolean).join(", ");
  const hasInvestment = property.expected_rent !== null || property.estimated_yield !== null;

  return (
    <>
      <Link
        href={`/r/${token}`}
        className="mb-5 inline-flex items-center gap-1 rounded-menu text-small font-medium text-brand-600 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring"
      >
        <Icon name="back" className="size-4" />
        חזרה
      </Link>

      <Panel variant="large" className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.15fr_1fr]">
        {/* Right (RTL start): gallery */}
        <PropertyGallery title={property.title} images={property.images.map((i) => i.storage_path)} />

        {/* Left (RTL end): details */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-h2 font-medium text-ink">{property.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-small text-slate-text">
              <Icon name="location" className="size-4" />
              {location}
            </p>
            <p dir="ltr" className="mt-2 text-end text-[28px] leading-9 font-semibold text-ink">
              {formatPrice(property.price)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCube icon="rooms" value={property.rooms} label="חדרים" />
            <StatCube
              icon="area"
              value={property.area_sqm ? <>{property.area_sqm} מ&quot;ר</> : dash}
              label="שטח"
            />
            <StatCube
              icon="floor"
              value={property.floor === null ? dash : property.floor === 0 ? "קרקע" : property.floor}
              label="קומה"
            />
            <StatCube
              icon="home"
              value={property.condition ? CONDITION_LABELS[property.condition] : dash}
              label="מצב הנכס"
            />
          </div>

          {features.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-body font-medium text-ink">מאפיינים</h2>
              <ul className="flex flex-wrap gap-2">
                {features.map((f) => (
                  <li key={f.name}>
                    <FeatureTag check>{f.label}</FeatureTag>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {property.description && (
            <section>
              <h2 className="mb-2 text-body font-medium text-ink">תיאור</h2>
              <p className="max-w-[70ch] text-body whitespace-pre-line text-ink">{property.description}</p>
            </section>
          )}

          {hasInvestment && (
            <Panel variant="muted" className="p-5">
              <h2 className="mb-3 text-small font-medium text-slate-text">נתוני השקעה</h2>
              <dl className="flex flex-wrap gap-x-10 gap-y-3">
                <div>
                  <dt className="text-caption text-slate-text">שכר דירה צפוי</dt>
                  <dd dir="ltr" className="text-end text-body-l font-semibold text-ink">
                    {property.expected_rent === null ? dash : formatPrice(property.expected_rent)}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-slate-text">תשואה משוערת</dt>
                  <dd dir="ltr" className="text-end text-body-l font-semibold text-ink">
                    {property.estimated_yield === null ? dash : `${property.estimated_yield.toFixed(1)}%`}
                  </dd>
                </div>
              </dl>
            </Panel>
          )}
        </div>
      </Panel>
    </>
  );
}

// DESIGN.md §1.3 — full property details, reached from the results screen.
export default function PropertyDetailsPage({ params }: PageProps<"/r/[token]/properties/[id]">) {
  return (
    <Suspense fallback={<Panel className="min-h-[480px] animate-pulse" aria-busy="true" />}>
      <PropertyDetails params={params} />
    </Suspense>
  );
}
