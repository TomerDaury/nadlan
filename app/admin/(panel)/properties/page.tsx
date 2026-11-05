import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/services/admin";
import { listProperties } from "@/lib/services/properties";
import { STATUS_LABELS } from "@/lib/validation/property";
import { DeletePropertyButton } from "@/app/admin/(panel)/properties/delete-property-button";

export const metadata: Metadata = { title: "נכסים | ממשק ניהול" };

const DONE_MESSAGES: Record<string, string> = {
  created: "הנכס נוסף בהצלחה",
  updated: "השינויים נשמרו",
  deleted: "הנכס נמחק",
};

async function DoneNotice({ searchParams }: { searchParams: PageProps<"/admin/properties">["searchParams"] }) {
  const { done } = await searchParams;
  const message = typeof done === "string" ? DONE_MESSAGES[done] : undefined;
  if (!message) return null;
  return (
    <Notice icon={CheckCircle2} className="mb-4">
      {message}
    </Notice>
  );
}

async function PropertiesTable() {
  await requireAdmin();
  const properties = await listProperties();

  if (!properties.length) {
    return (
      <Panel className="py-12 text-center text-body text-slate-text">
        אין עדיין נכסים במאגר. לחצו על &quot;הוספת נכס&quot; כדי להתחיל.
      </Panel>
    );
  }

  return (
    <Panel padding="none" className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-start text-small">
        <thead className="bg-table-head text-slate-text">
          <tr className="[&>th]:px-5 [&>th]:py-3 [&>th]:text-start [&>th]:font-medium">
            <th scope="col">כותרת</th>
            <th scope="col">אזור</th>
            <th scope="col">מחיר</th>
            <th scope="col">חדרים</th>
            <th scope="col">סטטוס</th>
            <th scope="col">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id} className="border-t border-row-divider [&>td]:px-5 [&>td]:py-3.5">
              <td className="font-medium text-ink">{property.title}</td>
              <td className="text-slate-text">
                {property.city} • {property.neighborhood}
              </td>
              <td dir="ltr" className="text-end whitespace-nowrap text-ink">
                {formatPrice(property.price)}
              </td>
              <td className="text-ink">{property.rooms}</td>
              <td>
                <Badge variant={property.status === "available" ? "success" : "neutral"}>
                  {STATUS_LABELS[property.status]}
                </Badge>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Button asChild variant="icon" size="icon">
                    <Link href={`/admin/properties/${property.id}`} aria-label={`עריכת ${property.title}`}>
                      <Icon name="edit" />
                    </Link>
                  </Button>
                  <DeletePropertyButton id={property.id} title={property.title} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function TableSkeleton() {
  return <Panel className="min-h-48 animate-pulse" aria-busy="true" aria-label="טוען נכסים" />;
}

// DESIGN.md §1.7 — properties management.
export default function AdminPropertiesPage({ searchParams }: PageProps<"/admin/properties">) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-h2 font-medium">נכסים</h1>
        <Button asChild size="sm">
          <Link href="/admin/properties/new">
            <Icon name="add" />
            הוספת נכס
          </Link>
        </Button>
      </div>
      <Suspense>
        <DoneNotice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <PropertiesTable />
      </Suspense>
    </>
  );
}
