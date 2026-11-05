import Link from "next/link";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";

// Client-site footer: a thin line with a small, clearly visible "agent login" button (PRD F7, DESIGN §1.11).
// Points to the admin area: logged-in agents land on their properties, others on the login screen.
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-end px-4 sm:px-10">
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/properties">
            <Icon name="user" />
            כניסת סוכן
          </Link>
        </Button>
      </div>
    </footer>
  );
}
