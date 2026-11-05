import type { Metadata } from "next";
import { Suspense } from "react";
import { Panel } from "@/components/ui/panel";
import { requireAdmin } from "@/lib/services/admin";
import { PropertyForm } from "@/app/admin/(panel)/properties/property-form";

export const metadata: Metadata = { title: "הוספת נכס | ממשק ניהול" };

async function NewPropertyForm() {
  await requireAdmin();
  // The id is chosen up front so images can be uploaded into the property's folder before saving.
  return <PropertyForm mode="create" propertyId={crypto.randomUUID()} />;
}

export default function NewPropertyPage() {
  return (
    <Suspense fallback={<Panel className="min-h-96 animate-pulse" aria-busy="true" />}>
      <NewPropertyForm />
    </Suspense>
  );
}
