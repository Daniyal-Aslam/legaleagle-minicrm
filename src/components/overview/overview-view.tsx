"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, BellRing, CheckCircle2, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-panels";
import { STATUS_STYLES, StatusBadge, StatusDot } from "@/components/shared/status-badge";
import { ContactStats } from "@/components/contacts/contact-stats";
import { CONTACT_STATUSES } from "@/types/contact";
import { STATUS_META } from "@/lib/constants";
import { formatDateTime, formatRelative } from "@/lib/format";
import { getMetadata } from "@/lib/activity/factory";
import type { Activity } from "@/types/activity";
import { getFullName, getStatusCounts } from "@/lib/contacts/selectors";
import { cn, pluralize } from "@/lib/utils";
import { useCrm, useLatestActivityMap } from "@/store";
import { useUiStore } from "@/store/ui-store";

/** Leads untouched for this many days are surfaced for follow-up. */
const STALE_LEAD_DAYS = 5;

export function OverviewView() {
  const hydrated = useCrm((s) => s.hydration === "ready");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="A snapshot of the pipeline and what needs attention today."
        actions={
          <Button size="lg" onClick={() => useUiStore.getState().openCreateContact()}>
            <Plus aria-hidden />
            Add contact
          </Button>
        }
      />
      <ContactStats />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="min-w-0 space-y-5">
          <PipelineSnapshot hydrated={hydrated} />
          <NeedsAttention hydrated={hydrated} />
        </div>
        <RecentActivity hydrated={hydrated} />
      </div>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card shadow-xs">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border-b px-4 py-3.5 sm:px-5">
        <h2 className="text-md font-semibold whitespace-nowrap">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function PipelineSnapshot({ hydrated }: { hydrated: boolean }) {
  const contacts = useCrm((s) => s.contacts);
  const counts = useMemo(() => getStatusCounts(contacts), [contacts]);

  return (
    <Card
      title="Pipeline at a glance"
      action={
        <Link href="/pipeline" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
          Open board <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      <div className="space-y-4 px-5 py-5">
        {hydrated ? (
          <div
            className="flex h-2.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={CONTACT_STATUSES.map((s) => `${STATUS_META[s].label}: ${counts[s]}`).join(", ")}
          >
            {CONTACT_STATUSES.map((status) =>
              counts[status] ? (
                <div
                  key={status}
                  className={cn("h-full border-r-2 border-card last:border-r-0", STATUS_STYLES[status].dot)}
                  style={{ width: `${(counts[status] / Math.max(counts.all, 1)) * 100}%` }}
                />
              ) : null,
            )}
          </div>
        ) : (
          <Skeleton className="h-2.5 rounded-full" />
        )}
        <ul className="grid grid-cols-3 gap-3">
          {CONTACT_STATUSES.map((status) => (
            <li key={status}>
              <Link
                href={`/contacts?status=${status}`}
                className="block rounded-lg border p-3 outline-none transition-colors hover:border-border-strong hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/35"
              >
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusDot status={status} />
                  {STATUS_META[status].label}
                </span>
                <span className="mt-1 block font-heading text-xl font-semibold tabular-nums">
                  {hydrated ? counts[status] : "…"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function NeedsAttention({ hydrated }: { hydrated: boolean }) {
  const contacts = useCrm((s) => s.contacts);
  const latest = useLatestActivityMap();

  const stale = useMemo(() => {
    const cutoff = new Date(Date.now() - STALE_LEAD_DAYS * 86_400_000).toISOString();
    return contacts
      .filter((c) => c.status === "lead")
      .map((c) => ({ contact: c, lastTouch: latest.get(c.id)?.createdAt ?? c.createdAt }))
      .filter((entry) => entry.lastTouch < cutoff)
      .sort((a, b) => a.lastTouch.localeCompare(b.lastTouch));
  }, [contacts, latest]);

  return (
    <Card
      title="Leads awaiting follow-up"
      action={<span className="text-xs text-muted-foreground">No activity in {STALE_LEAD_DAYS}+ days</span>}
    >
      {!hydrated ? (
        <div className="space-y-3 p-5" aria-hidden>
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : stale.length === 0 ? (
        <EmptyState compact icon={CheckCircle2} title="All leads are up to date" description="Every open lead has had contact in the last few days." />
      ) : (
        <ul className="divide-y">
          {stale.map(({ contact, lastTouch }) => (
            <li key={contact.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <ContactAvatar contact={contact} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-x-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <Link href={`/contacts/${contact.id}`} className="block truncate text-sm font-medium hover:text-bronze-800">
                    {getFullName(contact)}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{contact.matterType ?? contact.email}</p>
                </div>
                <span className="mt-1 flex shrink-0 items-center gap-1.5 text-xs text-status-lead-fg sm:mt-0">
                <BellRing className="size-3.5" aria-hidden />
                  Last touch {formatRelative(lastTouch)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RecentActivity({ hydrated }: { hydrated: boolean }) {
  const activities = useCrm((s) => s.activities);
  const contacts = useCrm((s) => s.contacts);

  const recent = useMemo(() => {
    const byId = new Map(contacts.map((c) => [c.id, c]));
    return [...activities]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8)
      .flatMap((activity) => {
        const contact = byId.get(activity.contactId);
        return contact ? [{ activity, contact }] : [];
      });
  }, [activities, contacts]);

  return (
    <Card title="Recent activity">
      {!hydrated ? (
        <div className="space-y-4 p-5" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <EmptyState compact icon={History} title="No activity yet" description="Notes, follow-ups and status changes will appear here." />
      ) : (
        <ol className="divide-y">
          {recent.map(({ activity, contact }) => (
            <li key={activity.id} className="flex gap-3 px-5 py-3">
              <ContactAvatar contact={contact} size="sm" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <Link href={`/contacts/${contact.id}`} className="font-medium hover:text-bronze-800">
                    {getFullName(contact)}
                  </Link>
                  <span className="text-muted-foreground"> · {activity.description}</span>
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)}>
                    {formatRelative(activity.createdAt)}
                  </time>
                  <MovedTo activity={activity} />
                  {activity.author ? <span className="truncate">by {activity.author}</span> : null}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {hydrated && recent.length ? (
        <p className="border-t px-5 py-3 text-xs text-muted-foreground">
          {pluralize(activities.length, "activity", "activities")} recorded across all contacts
        </p>
      ) : null}
    </Card>
  );
}

function MovedTo({ activity }: { activity: Activity }) {
  const move = getMetadata(activity, "status_changed");
  return move ? <StatusBadge status={move.to} className="h-5 px-2 text-2xs" /> : null;
}
