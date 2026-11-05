"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteRequestAction } from "@/app/admin/(panel)/requests/actions";

type Props = {
  id: string;
  name: string;
  /** "icon": red icon in the list row. "button": labelled button on the details screen. */
  variant: "icon" | "button";
};

// Delete → confirmation dialog → permanent delete (PRD F9: confirm before deleting).
export function DeleteRequestButton({ id, name, variant }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteRequestAction(id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>
        {variant === "icon" ? (
          <Button variant="icon" size="icon" tone="danger" aria-label={`מחיקת הפנייה של ${name}`}>
            <Icon name="delete" />
          </Button>
        ) : (
          <Button variant="neutral" size="sm">
            <Icon name="delete" className="text-error" />
            מחיקת פנייה
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>מחיקת פנייה</AlertDialogTitle>
        <AlertDialogDescription>
          למחוק את הפנייה של &quot;{name}&quot;? הפנייה ופרטי הלקוח יימחקו, הקישור האישי שלו יפסיק לעבוד, ולא ניתן
          לשחזר אותם.
        </AlertDialogDescription>
        {error && (
          <p role="alert" className="mt-3 text-small text-error">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="neutral" size="sm" disabled={pending}>
              ביטול
            </Button>
          </AlertDialogCancel>
          <Button size="sm" className="bg-error hover:bg-error/90" onClick={confirmDelete} disabled={pending}>
            {pending ? "מוחק..." : "מחיקה"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
