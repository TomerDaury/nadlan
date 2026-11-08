import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { TintBox } from "@/components/ui/tint-box";
import { formatArea, formatDate, formatPrice, formatRoomsRange } from "@/lib/format";
import { requireAdmin } from "@/lib/services/admin";
import { getRequestDetails, type RequestDetails } from "@/lib/services/admin-requests";
import { UpdatesBadge } from "@/app/admin/(panel)/requests/updates-badge";
import { DeleteRequestButton } from "@/app/admin/(panel)/requests/delete-request-button";

export const metadata: Metadata = { title: "פרטי פנייה | ממשק ניהול" };

function InfoPanel({ title, icon, children }: { title: string; icon: IconName; children: React.ReactNode }) {
  return (
    <Panel>
      <h2 className="mb-4 flex items-center gap-2 text-body font-medium text-ink">
        <Icon name={icon} className="size-5 text-brand-500" />
        {title}
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-small">{children}</dl>
    </Panel>
  );
}

function InfoRow({ label, children, ltr }: { label: string; children: React.ReactNode; ltr?: boolean }) {
  return (
    <>
      <dt className="text-slate-text">{label}</dt>
      <dd className="min-w-0 text-ink [overflow-wrap:anywhere]">
        {ltr ? <span dir="ltr">{children}</span> : children}
      </dd>
    </>
  );
}

function MatchesTable({ matches }: { matches: RequestDetails["matches"] }) {
  if (!matches.length) {
    return (
      <Panel className="py-10 text-center text-small text-slate-text">לא נמצאו נכסים מתאימים בזמן הפנייה.</Panel>
    );
  }

  return (
    <Panel padding="none" className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-start text-small">
        <thead className="bg-table-head text-slate-text">
          <tr className="[&>th]:px-5 [&>th]:py-3 [&>th]:text-start [&>th]:font-medium">
            <th scope="col" className="w-12">
              #
            </th>
            <th scope="col">נכס</th>
            <th scope="col">מחיר</th>
            <th scope="col">נימוק</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => (
            <tr
              key={match.rank}
              className={cn(
                "border-t border-row-divider [&>td]:px-5 [&>td]:py-3.5",
                match.deleted ? "text-muted-text" : "text-ink"
              )}
            >
              <td>
                <Badge variant={match.deleted ? "neutral" : "rank"} className="min-w-6">
                  {match.rank}
                </Badge>
              </td>
              <td className={cn(!match.deleted && "font-medium")}>{match.deleted ? "נכס שנמחק" : match.title}</td>
              <td dir="ltr" className="text-end whitespace-nowrap">
                {match.price === null ? "–" : formatPrice(match.price)}
              </td>
              <td className={cn(!match.deleted && "text-slate-text")}>{match.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

async function RequestDetailsView({ params }: { params: PageProps<"/admin/requests/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  const request = await getRequestDetails(id);
  if (!request) notFound();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h2 font-medium">פנייה של {request.name}</h1>
        <DeleteRequestButton id={request.id} name={request.name} variant="button" />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <InfoPanel title="פרטי הלקוח" icon="user">
          <InfoRow label="שם">{request.name}</InfoRow>
          <InfoRow label="אימייל" ltr>
            {request.email}
          </InfoRow>
          <InfoRow label="טלפון" ltr>
            {request.phone || "–"}
          </InfoRow>
          <InfoRow label="תאריך פנייה" ltr>
            {formatDate(request.created_at)}
          </InfoRow>
        </InfoPanel>
        <InfoPanel title="קריטריונים" icon="search">
          <InfoRow label="אזור">{formatArea(request.city, request.neighborhoods)}</InfoRow>
          <InfoRow label="תקציב">
            עד <span dir="ltr">{formatPrice(request.max_budget)}</span>
          </InfoRow>
          <InfoRow label="חדרים" ltr>
            {formatRoomsRange(request.rooms_min, request.rooms_max)}
          </InfoRow>
          <InfoRow label="עדכונים">
            <UpdatesBadge active={request.notifications_active} />
          </InfoRow>
        </InfoPanel>
      </div>

      <TintBox title="מה חשוב ללקוח" className="mb-8">
        <p className="whitespace-pre-line [overflow-wrap:anywhere]">&quot;{request.preferences_text}&quot;</p>
      </TintBox>

      <h2 className="mb-3 text-h3 font-medium">הנכסים שהוצגו ללקוח</h2>
      <MatchesTable matches={request.matches} />
    </>
  );
}

function DetailsSkeleton() {
  return (
    <div aria-busy="true" aria-label="טוען פנייה" className="space-y-4">
      <div className="h-9 w-64 animate-pulse rounded-input bg-line" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="min-h-44 animate-pulse" />
        <Panel className="min-h-44 animate-pulse" />
      </div>
      <Panel className="min-h-40 animate-pulse" />
    </div>
  );
}

// DESIGN.md §1.10 — request details (PRD F9). No edit actions; the only action is deleting the request.
export default function AdminRequestDetailsPage({ params }: PageProps<"/admin/requests/[id]">) {
  return (
    <>
      <Link
        href="/admin/requests"
        className="mb-3 inline-flex items-center gap-1 rounded-sm text-small text-brand-600 outline-none hover:text-brand-700 focus-visible:ring-3 focus-visible:ring-focus-ring"
      >
        <Icon name="back" className="size-4" />
        חזרה לפניות
      </Link>
      <Suspense fallback={<DetailsSkeleton />}>
        <RequestDetailsView params={params} />
      </Suspense>
    </>
  );
}
