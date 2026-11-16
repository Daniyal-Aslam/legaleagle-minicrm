"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CONTACT_STATUSES, type Contact, type ContactStatus } from "@/types/contact";
import { STATUS_META } from "@/lib/constants";
import { getFullName } from "@/lib/contacts/selectors";
import { crm } from "@/store";
import { StatusDot } from "./status-badge";

export function changeContactStatus(contact: Contact, status: ContactStatus) {
  if (contact.status === status) return;
  if (crm().changeStatus(contact.id, status)) {
    toast.success(`${getFullName(contact)} moved to ${STATUS_META[status].label}`);
  }
}

interface Props {
  contact: Contact;
  /** The trigger element (rendered with asChild). */
  children: ReactNode;
  align?: "start" | "end";
  label?: string;
}

/** Keyboard-accessible status change — the alternative to drag-and-drop. */
export function StatusMenu({ contact, children, align = "start", label = "Move to" }: Props) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={contact.status}
          onValueChange={(value) => changeContactStatus(contact, value as ContactStatus)}
        >
          {CONTACT_STATUSES.map((status) => (
            <DropdownMenuRadioItem key={status} value={status} className="items-start py-2">
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 font-medium">
                  <StatusDot status={status} />
                  {STATUS_META[status].label}
                </span>
                <span className="text-xs text-muted-foreground">{STATUS_META[status].description}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
