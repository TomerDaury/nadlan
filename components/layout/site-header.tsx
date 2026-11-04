import Link from "next/link";
import { Logo } from "@/components/layout/logo";

// Client-site header: white bar, thin bottom line, logo on the right (RTL start).
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center px-4 sm:px-10">
        <Link href="/" aria-label="לעמוד הראשי" className="rounded-menu outline-none focus-visible:ring-3 focus-visible:ring-focus-ring">
          <Logo />
        </Link>
      </div>
    </header>
  );
}
