import Link from "next/link";

// Client-site footer: a thin line with a small, low-key "agent login" link (PRD F7, DESIGN §1.11).
// Points to the admin area: logged-in agents land on their properties, others on the login screen.
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-end px-4 sm:px-10">
        <Link
          href="/admin/properties"
          className="rounded-menu text-caption text-muted-text transition-colors outline-none hover:text-slate-text focus-visible:ring-3 focus-visible:ring-focus-ring"
        >
          כניסת סוכן
        </Link>
      </div>
    </footer>
  );
}
