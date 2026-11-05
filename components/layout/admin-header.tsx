import { Suspense } from "react";
import { Logo } from "@/components/layout/logo";
import { Icon } from "@/components/icons";
import { requireAdmin } from "@/lib/services/admin";
import { logout } from "@/app/admin/actions";

// Avatar, agent email and logout link (DESIGN.md §1.7). Reads the session, so it streams in.
async function AgentMenu() {
  const { email } = await requireAdmin();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-brand-500 bg-brand-50 text-small font-medium text-brand-700 uppercase"
      >
        {email.charAt(0)}
      </span>
      <span dir="ltr" className="hidden truncate text-small text-ink sm:inline">
        {email}
      </span>
      <form action={logout}>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-menu px-1 text-small text-slate-text transition-colors outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-focus-ring"
        >
          התנתקות
          <Icon name="logout" className="size-4" />
        </button>
      </form>
    </div>
  );
}

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <Logo label="ממשק ניהול" />
        <Suspense>
          <AgentMenu />
        </Suspense>
      </div>
    </header>
  );
}
