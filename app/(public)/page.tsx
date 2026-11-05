import { Suspense } from "react";
import { ChatlingWidget } from "@/components/chatling-widget";
import { Panel } from "@/components/ui/panel";
import { listAvailableAreas } from "@/lib/services/areas";
import { RequestForm } from "@/app/(public)/request-form";

async function RequestFormLoader() {
  const areas = await listAvailableAreas();

  // Empty database / no available areas (PRD edge cases).
  if (!areas.length) {
    return (
      <Panel variant="large" className="mx-auto max-w-[880px] px-6 py-12 text-center sm:px-12">
        <h1 className="text-h2 font-medium">מצאו את הנכס שמתאים לכם</h1>
        <p className="mt-3 text-body text-slate-text">אין כרגע נכסים במערכת. נסו שוב בקרוב.</p>
      </Panel>
    );
  }

  return <RequestForm areas={areas} submissionId={crypto.randomUUID()} />;
}

// DESIGN.md §1.1 — the client site's home page is the request form (PRD F1).
export default function HomePage() {
  return (
    <>
      <Suspense
        fallback={<Panel variant="large" className="mx-auto min-h-[560px] max-w-[880px] animate-pulse" aria-busy="true" />}
      >
        <RequestFormLoader />
      </Suspense>
      {/* Chatbot on this screen only (PRD F1). */}
      <ChatlingWidget />
    </>
  );
}
