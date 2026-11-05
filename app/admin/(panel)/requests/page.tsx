import type { Metadata } from "next";
import { Suspense } from "react";
import { Panel } from "@/components/ui/panel";
import { requireAdmin } from "@/lib/services/admin";

export const metadata: Metadata = { title: "פניות | ממשק ניהול" };

async function RequestsPlaceholder() {
  await requireAdmin();
  return <Panel className="min-h-48" />;
}

// Base page; the requests table is built in Milestone 4.
export default function AdminRequestsPage() {
  return (
    <>
      <h1 className="mb-6 text-h2 font-medium">פניות</h1>
      <Suspense fallback={<Panel className="min-h-48" />}>
        <RequestsPlaceholder />
      </Suspense>
    </>
  );
}
