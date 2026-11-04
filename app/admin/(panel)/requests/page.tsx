import type { Metadata } from "next";
import { Panel } from "@/components/ui/panel";

export const metadata: Metadata = { title: "פניות | ממשק ניהול" };

// Base page; the requests table is built in Milestone 4.
export default function AdminRequestsPage() {
  return (
    <>
      <h1 className="mb-6 text-h2 font-medium">פניות</h1>
      <Panel className="min-h-48" />
    </>
  );
}
