import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Panel } from "@/components/ui/panel";
import { requireAdmin } from "@/lib/services/admin";
import { getProperty } from "@/lib/services/properties";
import { PropertyForm } from "@/app/admin/(panel)/properties/property-form";

export const metadata: Metadata = { title: "עריכת נכס | ממשק ניהול" };

async function EditPropertyForm({ params }: { params: PageProps<"/admin/properties/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const property = await getProperty(id);
  if (!property) notFound();

  return <PropertyForm mode="edit" propertyId={property.id} property={property} />;
}

export default function EditPropertyPage({ params }: PageProps<"/admin/properties/[id]">) {
  return (
    <Suspense fallback={<Panel className="min-h-96 animate-pulse" aria-busy="true" />}>
      <EditPropertyForm params={params} />
    </Suspense>
  );
}
