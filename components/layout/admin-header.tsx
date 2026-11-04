import { Logo } from "@/components/layout/logo";

// Admin header. The agent avatar, email and logout link are added in Milestone 2 (auth).
export function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className="flex h-16 items-center px-4 sm:px-6">
        <Logo label="ממשק ניהול" />
      </div>
    </header>
  );
}
