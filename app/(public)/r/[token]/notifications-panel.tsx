"use client";

import { useTransition } from "react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { setNotificationsAction } from "@/app/(public)/r/[token]/actions";

// DESIGN.md §1.4 — email updates status. Stopping asks for confirmation (PRD Flow 3);
// turning them back on does not.
export function NotificationsPanel({ token, active }: { token: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  function setActive(next: boolean) {
    startTransition(() => setNotificationsAction(token, next));
  }

  return (
    <Panel className="flex flex-col gap-4 p-5">
      <p className="flex items-center gap-2 text-body font-medium text-ink">
        <Icon name="bell" className="size-5 text-brand-500" />
        עדכונים במייל:
        <Badge variant={active ? "success" : "neutral"}>{active ? "פעיל" : "מופסק"}</Badge>
      </p>

      {active ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="neutral" size="sm" className="w-full" disabled={pending}>
              הפסקת עדכונים
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>הפסקת עדכונים</AlertDialogTitle>
            <AlertDialogDescription>
              לא תקבלו יותר מיילים על נכסים חדשים. הדף האישי ימשיך להיות זמין, ותוכלו להפעיל את העדכונים מחדש בכל
              זמן.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="neutral" size="sm" disabled={pending}>
                  ביטול
                </Button>
              </AlertDialogCancel>
              <Button size="sm" onClick={() => setActive(false)} disabled={pending}>
                {pending ? "מפסיקים..." : "הפסקת עדכונים"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <>
          <p className="text-small text-slate-text">לא תקבלו מיילים על נכסים חדשים שמתאימים לכם.</p>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => setActive(true)} disabled={pending}>
            {pending ? "מפעילים..." : "הפעלת עדכונים מחדש"}
          </Button>
        </>
      )}
    </Panel>
  );
}
