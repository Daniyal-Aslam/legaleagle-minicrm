"use client";

import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import type { Contact } from "@/types/contact";
import { getFullName } from "@/lib/contacts/selectors";
import { crm } from "@/store";

interface Props {
  contact: Contact | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteContactDialog({ contact, onOpenChange, onDeleted }: Props) {
  return (
    <AlertDialog open={contact !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {contact ? getFullName(contact) : "contact"}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the contact along with their notes and activity history. This
            can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={() => {
              if (!contact) return;
              crm().deleteContact(contact.id);
              toast.success(`${getFullName(contact)} deleted`);
              onDeleted?.();
            }}
          >
            Delete contact
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
