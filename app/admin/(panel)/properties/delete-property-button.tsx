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
import { deletePropertyAction } from "@/app/admin/(panel)/properties/actions";

// Red delete icon → confirmation dialog → delete (PRD: confirm before deleting).
export function DeletePropertyButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    setError(undefined);
    startTransition(async () => {
      const result = await deletePropertyAction(id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <Button variant="icon" size="icon" tone="danger" aria-label={`מחיקת ${title}`}>
          <Icon name="delete" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>מחיקת נכס</AlertDialogTitle>
        <AlertDialogDescription>
          למחוק את הנכס &quot;{title}&quot;? הנכס והתמונות שלו יימחקו, ולא ניתן לשחזר אותם.
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
