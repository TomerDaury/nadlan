import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

// Wrong or unknown personal link: one message, no details (PRD edge cases).
export function InvalidLink() {
  return (
    <Panel variant="large" className="mx-auto max-w-[560px] px-6 py-12 text-center">
      <h1 className="text-h2 font-medium">הקישור אינו תקין</h1>
      <p className="mt-3 text-body text-slate-text">בדקו שהעתקתם את הקישור המלא מהמייל.</p>
      <Button asChild variant="secondary" size="sm" className="mt-6">
        <Link href="/">לטופס הפנייה</Link>
      </Button>
    </Panel>
  );
}
