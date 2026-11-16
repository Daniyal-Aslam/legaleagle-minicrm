"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Activity } from "@/types/activity";
import type { Contact } from "@/types/contact";
import { formatRelative } from "@/lib/format";
import { getFullName } from "@/lib/contacts/selectors";
import { ContactRowActions } from "./contact-row-actions";

interface Props {
  contacts: Contact[];
  latestActivity: Map<string, Activity>;
  onDelete: (contact: Contact) => void;
}

/** Compact mobile presentation of the contact table. */
export function ContactCardList({ contacts, latestActivity, onDelete }: Props) {
  return (
    <ul className="divide-y">
      {contacts.map((contact) => {
        const activity = latestActivity.get(contact.id);
        return (
          <li key={contact.id} className="relative flex gap-3 p-4">
            <ContactAvatar contact={contact} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="block truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                  >
                    {getFullName(contact)}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{contact.company ?? "Individual"}</p>
                </div>
                <StatusBadge status={contact.status} className="shrink-0" />
              </div>
              <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <Mail className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{contact.email}</span>
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                <Phone className="size-3 shrink-0" aria-hidden />
                {contact.phone}
              </p>
              {activity ? (
                <p className="truncate text-xs text-subtle-foreground">
                  {activity.description} · {formatRelative(activity.createdAt)}
                </p>
              ) : null}
            </div>
            <div className="relative z-10 -mr-2 self-start">
              <ContactRowActions contact={contact} onDelete={onDelete} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ContactCardListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden className="divide-y">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3 p-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
