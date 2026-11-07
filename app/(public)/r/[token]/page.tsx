import Link from "next/link";
import { Suspense } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { Icon } from "@/components/icons";
import { InvalidLink } from "@/components/property/invalid-link";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyMiniCard } from "@/components/property/property-mini-card";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { formatArea, formatPrice, formatRoomsRange } from "@/lib/format";
import { getCurrentMatches, getRequestByToken, type ClientRequest, type MatchCard } from "@/lib/services/requests";
import { NotificationsPanel } from "@/app/(public)/r/[token]/notifications-panel";

type Props = PageProps<"/r/[token]">;

const FUTURE_UPDATES = "נעדכן אתכם במייל כשייכנס נכס נוסף שמתאים לכם.";

/** Messages after an action on the personal page. */
const DONE_MESSAGES: Record<string, string> = {
  updated: "הקריטריונים עודכנו. שלחנו לכם מייל עם התוצאות החדשות.",
  stopped: "העדכונים במייל הופסקו.",
  resumed: "העדכונים במייל הופעלו מחדש.",
};

function Heading({ count }: { count: number }) {
  const number = <span className="text-brand-500">{count === 1 ? "אחד" : count}</span>;
  return (
    <h1 className="text-h2 font-medium sm:text-h1">
      {count === 1 ? <>מצאנו עבורכם נכס {number}</> : <>מצאנו עבורכם {number} נכסים</>}
    </h1>
  );
}

const personalPageLink = (token: string) => (
  <Button asChild variant="secondary" size="sm">
    <Link href={`/r/${token}`}>לדף האישי שלי</Link>
  </Button>
);

/** DESIGN.md §1.2 — results, right after the request form was sent. */
function ResultsView({ token, matches }: { token: string; matches: MatchCard[] }) {
  // No matching properties (PRD edge cases): the request is saved; updates will follow.
  if (!matches.length) {
    return (
      <Panel variant="large" className="mx-auto max-w-[640px] px-6 py-12 text-center">
        <Icon name="search" className="mx-auto mb-4 size-10 text-brand-500" />
        <h1 className="text-h2 font-medium">לא נמצאו כרגע נכסים מתאימים</h1>
        <p className="mt-3 text-body text-slate-text">
          הפנייה שלכם נשמרה, ושלחנו לכם אישור במייל. נעדכן אתכם כשייכנס נכס שמתאים לכם.
        </p>
        <div className="mt-6">{personalPageLink(token)}</div>
      </Panel>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Heading count={matches.length} />
        <Notice>שלחנו את התוצאות גם למייל שלכם</Notice>
      </div>
      {/* Fewer than 3 (PRD F3): show only what was found, plus a note about future updates. */}
      {matches.length < 3 && (
        <Notice icon={Bell} className="mb-6">
          {FUTURE_UPDATES}
        </Notice>
      )}
      <div className="grid gap-6 md:grid-cols-3">
        {matches.map((match) => (
          <PropertyCard key={match.property.id} match={match} href={`/r/${token}/properties/${match.property.id}`} />
        ))}
      </div>
      <div className="mt-8 flex justify-center">{personalPageLink(token)}</div>
    </>
  );
}

function CriteriaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-caption text-slate-text">{label}</dt>
      <dd className="text-small text-ink">{children}</dd>
    </div>
  );
}

/** DESIGN.md §1.4 — the personal page. */
function PersonalPage({
  token,
  request,
  matches,
  done,
}: {
  token: string;
  request: ClientRequest;
  matches: MatchCard[];
  done?: string;
}) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-h2 font-medium sm:text-h1">הפנייה שלי</h1>
        <p className="mt-1 text-body text-slate-text">כאן תמצאו את כל הנכסים שהתאמנו עבורכם</p>
      </div>

      {done && DONE_MESSAGES[done] && (
        <Notice icon={CheckCircle2} className="mb-6">
          {DONE_MESSAGES[done]}
        </Notice>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
        {/* Right (RTL start): criteria and updates. On mobile they come first. */}
        <div className="flex flex-col gap-6">
          <Panel className="flex flex-col gap-4 p-5">
            <h2 className="flex items-center gap-2 text-body font-medium text-ink">
              <Icon name="search" className="size-5 text-brand-500" />
              הקריטריונים שלי
            </h2>
            <dl className="flex flex-col gap-3">
              <CriteriaRow label="אזור">{formatArea(request.city, request.neighborhoods)}</CriteriaRow>
              <CriteriaRow label="תקציב">
                עד <span dir="ltr">{formatPrice(request.max_budget)}</span>
              </CriteriaRow>
              <CriteriaRow label="חדרים">
                <span dir="ltr">{formatRoomsRange(request.rooms_min, request.rooms_max)}</span>
              </CriteriaRow>
              <CriteriaRow label="מה חשוב לי">
                <span className="whitespace-pre-line">{request.preferences_text}</span>
              </CriteriaRow>
            </dl>
            <Button asChild variant="secondary" size="sm" className="w-full">
              <Link href={`/r/${token}/edit`}>
                <Icon name="edit" />
                עדכון הקריטריונים
              </Link>
            </Button>
          </Panel>

          <NotificationsPanel token={token} active={request.notifications_active} />
        </div>

        {/* Left (RTL end): the properties shown for the current criteria. */}
        <section aria-labelledby="shown-heading">
          <h2 id="shown-heading" className="mb-4 text-h3 font-medium text-ink">
            הנכסים שהוצגו לי
          </h2>
          {matches.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {matches.map((match) => (
                <PropertyMiniCard key={match.property.id} match={match} href={`/r/${token}/properties/${match.property.id}`} />
              ))}
            </div>
          ) : (
            <Panel className="px-6 py-10 text-center">
              <p className="text-body text-slate-text">
                לא נמצאו כרגע נכסים מתאימים. נעדכן אתכם במייל כשייכנס נכס שמתאים לכם.
              </p>
            </Panel>
          )}
        </section>
      </div>
    </>
  );
}

async function PersonalLinkContent({ params, searchParams }: Props) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const request = await getRequestByToken(token);
  if (!request) return <InvalidLink />;

  const matches = await getCurrentMatches(request.id);
  if (query.view === "results") return <ResultsView token={token} matches={matches} />;

  const done = typeof query.done === "string" ? query.done : undefined;
  return <PersonalPage token={token} request={request} matches={matches} done={done} />;
}

function PageSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3" aria-busy="true" aria-label="טוען">
      {[0, 1, 2].map((i) => (
        <Panel key={i} className="min-h-[420px] animate-pulse" />
      ))}
    </div>
  );
}

// /r/[token] (ARCHITECTURE §2.3): right after the request form it is the results screen
// (?view=results, DESIGN §1.2); from the email or any later visit it is the personal page (§1.4).
export default function PersonalLinkPage(props: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PersonalLinkContent {...props} />
    </Suspense>
  );
}
