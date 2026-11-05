import { Suspense } from "react";
import { Bell } from "lucide-react";
import { InvalidLink } from "@/components/property/invalid-link";
import { PropertyCard } from "@/components/property/property-card";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { Icon } from "@/components/icons";
import { getCurrentMatches, getRequestByToken } from "@/lib/services/requests";

const FUTURE_UPDATES = "נעדכן אתכם במייל כשייכנס נכס נוסף שמתאים לכם.";

function Heading({ count }: { count: number }) {
  const number = <span className="text-brand-500">{count === 1 ? "אחד" : count}</span>;
  return (
    <h1 className="text-h2 font-medium sm:text-h1">
      {count === 1 ? <>מצאנו עבורכם נכס {number}</> : <>מצאנו עבורכם {number} נכסים</>}
    </h1>
  );
}

async function Results({ params }: { params: PageProps<"/r/[token]">["params"] }) {
  const { token } = await params;
  const request = await getRequestByToken(token);
  if (!request) return <InvalidLink />;

  const matches = await getCurrentMatches(request.id);

  // No matching properties (PRD edge cases): the request is saved; updates will follow.
  if (!matches.length) {
    return (
      <Panel variant="large" className="mx-auto max-w-[640px] px-6 py-12 text-center">
        <Icon name="search" className="mx-auto mb-4 size-10 text-brand-500" />
        <h1 className="text-h2 font-medium">לא נמצאו כרגע נכסים מתאימים</h1>
        <p className="mt-3 text-body text-slate-text">
          הפנייה שלכם נשמרה. נעדכן אתכם במייל כשייכנס נכס שמתאים לכם.
        </p>
      </Panel>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Heading count={matches.length} />
        {/* Fewer than 3 (PRD F3): show only what was found, plus a note about future updates. */}
        {matches.length < 3 && <Notice icon={Bell}>{FUTURE_UPDATES}</Notice>}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {matches.map((match) => (
          <PropertyCard key={match.property.id} match={match} href={`/r/${token}/properties/${match.property.id}`} />
        ))}
      </div>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3" aria-busy="true" aria-label="טוען תוצאות">
      {[0, 1, 2].map((i) => (
        <Panel key={i} className="min-h-[420px] animate-pulse" />
      ))}
    </div>
  );
}

// DESIGN.md §1.2 — results. /r/[token] is the client's personal page (ARCHITECTURE §2.3);
// in this milestone it shows the results only.
export default function ResultsPage({ params }: PageProps<"/r/[token]">) {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <Results params={params} />
    </Suspense>
  );
}
