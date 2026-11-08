"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";

const NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin/properties", label: "נכסים", icon: "home" },
  { href: "/admin/requests", label: "פניות", icon: "list" },
];

// Side menu on desktop (right side in RTL); horizontal top menu on small screens.
// usePathname() is request data on dynamic routes, so the active item streams in;
// the fallback renders the same menu without highlighting.
export function AdminSidebar() {
  return (
    <Suspense fallback={<SidebarNav pathname={null} />}>
      <ActiveSidebarNav />
    </Suspense>
  );
}

function ActiveSidebarNav() {
  return <SidebarNav pathname={usePathname()} />;
}

function SidebarNav({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="תפריט ניהול"
      className="border-b border-line bg-white md:w-[170px] md:shrink-0 md:border-e md:border-b-0"
    >
      <ul className="flex gap-1 overflow-x-auto p-2 md:sticky md:top-16 md:flex-col md:p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname !== null && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-menu px-3 text-small whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-focus-ring",
                  active ? "bg-brand-50 font-medium text-brand-700" : "text-ink hover:bg-mist"
                )}
              >
                <Icon name={item.icon} className="size-[18px]" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
