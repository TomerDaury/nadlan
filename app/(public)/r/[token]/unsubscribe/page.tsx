import Link from "next/link";
import { Suspense } from "react";
import { Icon } from "@/components/icons";
import { InvalidLink } from "@/components/property/invalid-link";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getRequestByToken } from "@/lib/services/requests";
import { setNotificationsAction } from "@/app/(public)/r/[token]/actions";

async function Unsubscribe({ params }: { params: PageProps<"/r/[token]/unsubscribe">["params"] }) {
  const { token } = await params;
  const request = await getRequestByToken(token);
  if (!request) return <InvalidLink />;

  const backLink = (
    <Link
      href={`/r/${token}`}
      className="rounded-menu text-small font-medium text-brand-600 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring"
    >
      חזרה לדף האישי
    </Link>
  );

  return (
    <Panel variant="large" className="mx-auto max-w-[560px] px-6 py-10 text-center">
      <Icon name="bell" className="mx-auto mb-4 size-10 text-brand-500" />
      <h1 className="text-h2 font-medium">הפסקת עדכונים</h1>
      {request.notifications_active ? (
        <>
          <p className="mt-3 text-body text-slate-text">
            לא תקבלו יותר מיילים על נכסים חדשים. הדף האישי ימשיך להיות זמין.
          </p>
          {/* Opening this page (GET) changes nothing; only this POST stops the updates (ARCHITECTURE §2.3). */}
          <form action={setNotificationsAction.bind(null, token, false)} className="mt-6 flex flex-col items-center gap-4">
            <Button type="submit">הפסקת עדכונים</Button>
            {backLink}
          </form>
        </>
      ) : (
        <>
          <p className="mt-3 text-body text-slate-text">העדכונים כבר מופסקים.</p>
          <div className="mt-6">{backLink}</div>
        </>
      )}
    </Panel>
  );
}

// "הפסקת עדכונים" link in every email — a confirmation screen before the change.
export default function UnsubscribePage({ params }: PageProps<"/r/[token]/unsubscribe">) {
  return (
    <Suspense
      fallback={<Panel variant="large" className="mx-auto min-h-[280px] max-w-[560px] animate-pulse" aria-busy="true" />}
    >
      <Unsubscribe params={params} />
    </Suspense>
  );
}
