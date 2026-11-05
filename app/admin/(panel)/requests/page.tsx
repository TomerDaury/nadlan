import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { formatArea, formatDate, formatPrice, formatRoomsRange } from "@/lib/format";
import { requireAdmin } from "@/lib/services/admin";
import { listRequests } from "@/lib/services/admin-requests";
import { UpdatesBadge } from "@/app/admin/(panel)/requests/updates-badge";
import { DeleteRequestButton } from "@/app/admin/(panel)/requests/delete-request-button";

export const metadata: Metadata = { title: "פניות | ממשק ניהול" };

async function DoneNotice({ searchParams }: { searchParams: PageProps<"/admin/requests">["searchParams"] }) {
  const { done } = await searchParams;
  if (done !== "deleted") return null;
  return (
    <Notice icon={CheckCircle2} className="mb-4">
      הפנייה נמחקה
    </Notice>
  );
}

async function RequestsTable() {
  await requireAdmin();
  const requests = await listRequests();

  if (!requests.length) {
    return <Panel className="py-12 text-center text-body text-slate-text">עדיין לא התקבלו פניות.</Panel>;
  }

  return (
    <Panel padding="none" className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-start text-small">
        <thead className="bg-table-head text-slate-text">
          <tr className="[&>th]:px-5 [&>th]:py-3 [&>th]:text-start [&>th]:font-medium">
            <th scope="col">שם הלקוח</th>
            <th scope="col">תאריך</th>
            <th scope="col">אזור</th>
            <th scope="col">תקציב</th>
            <th scope="col">חדרים</th>
            <th scope="col">עדכונים</th>
            <th scope="col">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            // The name link is stretched over the whole row, so any click on the row opens it.
            <tr
              key={request.id}
              className="relative border-t border-row-divider transition-colors hover:bg-table-head [&>td]:px-5 [&>td]:py-3.5"
            >
              <td className="font-medium text-ink">
                <Link
                  href={`/admin/requests/${request.id}`}
                  className="outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-focus-ring focus-visible:after:ring-inset"
                >
                  {request.name}
                </Link>
              </td>
              <td dir="ltr" className="text-end whitespace-nowrap text-slate-text">
                {formatDate(request.created_at)}
              </td>
              <td className="text-slate-text">{formatArea(request.city, request.neighborhoods)}</td>
              <td dir="ltr" className="text-end whitespace-nowrap text-ink">
                {formatPrice(request.max_budget)}
              </td>
              <td dir="ltr" className="text-end whitespace-nowrap text-ink">
                {formatRoomsRange(request.rooms_min, request.rooms_max)}
              </td>
              <td>
                <UpdatesBadge active={request.notifications_active} />
              </td>
              {/* Above the stretched row link, so the icon opens the dialog, not the request. */}
              <td className="relative z-10">
                <DeleteRequestButton id={request.id} name={request.name} variant="icon" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function TableSkeleton() {
  return <Panel className="min-h-48 animate-pulse" aria-busy="true" aria-label="טוען פניות" />;
}

// DESIGN.md §1.9 — requests list (PRD F9: read-only apart from deleting a request).
export default function AdminRequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  return (
    <>
      <h1 className="mb-6 text-h2 font-medium">פניות</h1>
      <Suspense>
        <DoneNotice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RequestsTable />
      </Suspense>
    </>
  );
}
