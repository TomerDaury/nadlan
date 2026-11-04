import type { Metadata } from "next";
import { Panel } from "@/components/ui/panel";

export const metadata: Metadata = { title: "נכסים | ממשק ניהול" };

// Base page; the properties table and actions are built in Milestone 2.
export default function AdminPropertiesPage() {
  return (
    <>
      <h1 className="mb-6 text-h2 font-medium">נכסים</h1>
      <Panel className="min-h-48" />
    </>
  );
}
