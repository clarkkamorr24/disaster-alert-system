"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteZone } from "@/actions/zones";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { isRedirectError } from "@/lib/redirect-error";

interface DeleteZoneButtonProps {
  id: string;
  name: string;
}

export function DeleteZoneButton({ id, name }: DeleteZoneButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        const result = await deleteZone(id);
        if (!result.success) {
          toast.error(result.error);
          setOpen(false);
        }
      } catch (error) {
        // A successful delete redirects to /zones; let Next.js finish the navigation.
        if (isRedirectError(error)) toast.success(`Zone "${name}" deleted.`);
        throw error;
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" className="h-11 px-4 text-base" />}>
        <Trash2 data-icon="inline-start" />
        Delete zone
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete zone &quot;{name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This can&rsquo;t be undone. Zones that still have members can&rsquo;t be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="h-11 px-4"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
