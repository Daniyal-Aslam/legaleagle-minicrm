"use client";

import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/state-panels";
import { useContact, useIsHydrated } from "@/store";
import { ActivityTimeline } from "./activity-timeline";
import { ContactHeader } from "./contact-header";
import { ContactInfo } from "./contact-info";
import { NotesPanel } from "./notes-panel";

export function ContactDetailView({ contactId }: { contactId: string }) {
  const hydrated = useIsHydrated();
  const contact = useContact(contactId);

  if (!hydrated) return <ContactDetailSkeleton />;

  if (!contact) {
    return (
      <div className="rounded-xl border bg-card shadow-xs">
        <EmptyState
          icon={UserX}
          title="Contact not found"
          description="This contact may have been deleted, or the link is incorrect. Contacts are stored in this browser only."
          action={
            <Button asChild>
              <Link href="/contacts">
                <ArrowLeft aria-hidden />
                Back to contacts
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackLink />
      <ContactHeader contact={contact} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <aside aria-label="Contact information" className="lg:order-2">
          <ContactInfo contact={contact} />
        </aside>
        <div className="min-w-0 space-y-5 lg:order-1">
          <NotesPanel contactId={contact.id} />
          <ActivityTimeline contactId={contact.id} />
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/contacts"
      className="inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <ArrowLeft className="size-4" aria-hidden />
      All contacts
    </Link>
  );
}

function ContactDetailSkeleton() {
  return (
    <div className="space-y-5" aria-busy>
      <span className="sr-only" role="status">
        Loading contact…
      </span>
      <Skeleton className="h-5 w-28" />
      <div className="flex items-start gap-4 rounded-xl border bg-card p-6 shadow-xs">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Skeleton className="h-80 rounded-xl lg:order-2" />
        <Skeleton className="h-96 rounded-xl lg:order-1" />
      </div>
    </div>
  );
}
