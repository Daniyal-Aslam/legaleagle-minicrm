"use client";

import Link from "next/link";
import { ArrowUpRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Contact } from "@/types/contact";
import { getFullName } from "@/lib/contacts/selectors";
import { useUiStore } from "@/store/ui-store";

interface Props {
  contact: Contact;
  onDelete: (contact: Contact) => void;
}

export function ContactRowActions({ contact, onDelete }: Props) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${getFullName(contact)}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/contacts/${contact.id}`}>
            <ArrowUpRight aria-hidden />
            Open profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => useUiStore.getState().openEditContact(contact.id)}>
          <Pencil aria-hidden />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(contact)}>
          <Trash2 aria-hidden />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
