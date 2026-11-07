import Link from "next/link";
import { Suspense } from "react";
import { Icon } from "@/components/icons";
import { InvalidLink } from "@/components/property/invalid-link";
import { Panel } from "@/components/ui/panel";
import { listAvailableAreas } from "@/lib/services/areas";
import { getRequestByToken } from "@/lib/services/requests";
import { updateCriteriaAction } from "@/app/(public)/r/[token]/actions";
import { CriteriaForm } from "@/app/(public)/r/[token]/edit/criteria-form";

async function EditCriteria({ params }: { params: PageProps<"/r/[token]/edit">["params"] }) {
  const { token } = await params;
  const request = await getRequestByToken(token);
  if (!request) return <InvalidLink />;
  const areas = await listAvailableAreas();

  return (
    <div className="mx-auto max-w-[640px]">
      <Link
        href={`/r/${token}`}
        className="mb-5 inline-flex items-center gap-1 rounded-menu text-small font-medium text-brand-600 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring"
      >
        <Icon name="back" className="size-4" />
        חזרה לדף האישי
      </Link>
      <Panel variant="large" className="px-5 py-8 sm:px-10">
        <div className="mb-6 text-center">
          <h1 className="text-h2 font-medium">עדכון הקריטריונים</h1>
          <p className="mt-2 text-body text-slate-text">לאחר השמירה נציג לכם התאמות חדשות</p>
        </div>
        {areas.length ? (
          <CriteriaForm token={token} areas={areas} request={request} action={updateCriteriaAction.bind(null, token)} />
        ) : (
          <p className="text-center text-body text-slate-text">אין כרגע נכסים במערכת. נסו שוב בקרוב.</p>
        )}
      </Panel>
    </div>
  );
}

// DESIGN.md §1.5 — update criteria (ARCHITECTURE §2.3: /r/[token]/edit).
export default function EditCriteriaPage({ params }: PageProps<"/r/[token]/edit">) {
  return (
    <Suspense
      fallback={<Panel variant="large" className="mx-auto min-h-[560px] max-w-[640px] animate-pulse" aria-busy="true" />}
    >
      <EditCriteria params={params} />
    </Suspense>
  );
}
