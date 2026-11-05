import type { Metadata } from "next";
import { Suspense } from "react";
import { Icon } from "@/components/icons";
import { LoginForm } from "@/app/admin/login/login-form";

export const metadata: Metadata = { title: "כניסה לממשק הניהול" };

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "אין לך הרשאת גישה לממשק הניהול",
  failed: "ההתחברות נכשלה. נסו שוב.",
};

async function LoginError({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERROR_MESSAGES[error] : undefined;
  if (!message) return null;

  return (
    <p role="alert" className="mb-4 rounded-input bg-error/10 px-4 py-2.5 text-small text-error">
      {message}
    </p>
  );
}

// DESIGN.md §1.6 — no header or side menu on this screen.
export default function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-mist px-4 py-16">
      {/* Decorative soft orange circles */}
      <div aria-hidden className="absolute -top-40 -end-40 size-[480px] rounded-full bg-brand-50" />
      <div aria-hidden className="absolute -bottom-40 -start-32 size-[360px] rounded-full bg-brand-50" />

      <section className="relative w-full max-w-[400px] rounded-card bg-white p-8 text-center shadow-floating">
        <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-card bg-brand-500 text-white">
          <Icon name="home" className="size-7" strokeWidth={2} />
        </span>
        <h1 className="text-h3 font-medium text-ink">כניסה לממשק הניהול</h1>
        <p className="mt-1 mb-6 text-small text-slate-text">הכניסה מותרת לסוכן בלבד</p>

        <Suspense>
          <LoginError searchParams={searchParams} />
        </Suspense>

        <LoginForm />
      </section>
    </main>
  );
}
