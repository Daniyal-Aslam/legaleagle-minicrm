"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "@/components/shared/status-badge";
import type { ContactStatus } from "@/types/contact";
import { getMetadata } from "@/lib/activity/factory";
import { getStatusCounts } from "@/lib/contacts/selectors";
import { useCrm } from "@/store";
import { cn, pluralize } from "@/lib/utils";

const DAY = 86_400_000;

/** Statistics derived purely from stored contacts and activities. */
export function ContactStats({ className }: { className?: string }) {
  const hydrated = useCrm((s) => s.hydration === "ready");
  const contacts = useCrm((s) => s.contacts);
  const activities = useCrm((s) => s.activities);

  const stats = useMemo(() => {
    const since = new Date(Date.now() - 30 * DAY).toISOString();
    const counts = getStatusCounts(contacts);
    const addedRecently = contacts.filter((c) => c.createdAt >= since).length;
    const closedRecently = activities.filter(
      (a) => a.createdAt >= since && getMetadata(a, "status_changed")?.to === "closed",
    ).length;
    const share = (n: number) => (counts.all ? Math.round((n / counts.all) * 100) : 0);

    return [
      { key: "all", label: "Total contacts", value: counts.all, hint: `${addedRecently} added in the last 30 days` },
      { key: "lead", label: "Leads", value: counts.lead, hint: `${share(counts.lead)}% awaiting qualification` },
      { key: "active", label: "Active clients", value: counts.active, hint: `${share(counts.active)}% of all contacts` },
      { key: "closed", label: "Closed", value: counts.closed, hint: `${pluralize(closedRecently, "closure")} in the last 30 days` },
    ] as const;
  }, [contacts, activities]);

  return (
    <dl className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4", className)}>
      {stats.map((stat) => (
        <div key={stat.key} className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            {stat.key === "all" ? (
              <Users className="size-3.5 text-brand-bronze" aria-hidden />
            ) : (
              <StatusDot status={stat.key as ContactStatus} className="size-2" />
            )}
            {stat.label}
          </dt>
          <dd className="mt-2">
            {hydrated ? (
              <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{stat.value}</span>
            ) : (
              <Skeleton className="h-[38px] w-14" />
            )}
          </dd>
          <dd className="mt-1 text-xs text-muted-foreground sm:truncate">
            {hydrated ? stat.hint : <Skeleton className="h-[18px] w-32" />}
          </dd>
        </div>
      ))}
    </dl>
  );
}
