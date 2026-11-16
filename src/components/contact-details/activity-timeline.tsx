"use client";

import { ArrowRight, History, NotebookPen, PencilLine, Sparkles, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/state-panels";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Activity, ActivityType } from "@/types/activity";
import { getMetadata } from "@/lib/activity/factory";
import { FOLLOW_UP_LABELS } from "@/lib/constants";
import { formatDateTime, formatDayHeading, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useContactActivities } from "@/store";
import { CHANNEL_ICONS } from "./follow-up-dialog";

const TYPE_STYLES: Record<ActivityType, { icon: LucideIcon; className: string }> = {
  contact_created: { icon: Sparkles, className: "bg-bronze-50 text-brand-bronze ring-bronze-100" },
  contact_updated: { icon: PencilLine, className: "bg-muted text-muted-foreground ring-border" },
  status_changed: { icon: ArrowRight, className: "bg-status-active-bg text-status-active-fg ring-status-active-fg/15" },
  note_added: { icon: NotebookPen, className: "bg-status-lead-bg text-status-lead-fg ring-status-lead-fg/15" },
  follow_up: { icon: History, className: "bg-status-closed-bg text-status-closed-fg ring-status-closed-fg/15" },
};

/** Chronological, day-grouped history generated from real store actions. */
export function ActivityTimeline({ contactId }: { contactId: string }) {
  const activities = useContactActivities(contactId);

  const groups: { day: string; items: Activity[] }[] = [];
  for (const activity of activities) {
    const day = formatDayHeading(activity.createdAt);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(activity);
    else groups.push({ day, items: [activity] });
  }

  return (
    <section aria-labelledby="activity-heading" className="rounded-xl border bg-card shadow-xs">
      <header className="flex items-center justify-between border-b px-5 py-3.5">
        <h2 id="activity-heading" className="text-md font-semibold">
          Activity
        </h2>
        <span className="text-xs text-muted-foreground">Newest first</span>
      </header>
      {activities.length === 0 ? (
        <EmptyState compact icon={History} title="No activity yet" description="Changes, notes and follow-ups will appear here." />
      ) : (
        <div className="space-y-5 px-5 py-5">
          {groups.map((group) => (
            <div key={group.day}>
              <h3 className="mb-3 font-sans text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                {group.day}
              </h3>
              <ol className="relative">
                {group.items.map((activity, index) => (
                  <TimelineItem key={activity.id} activity={activity} isLast={index === group.items.length - 1} />
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TimelineItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const followUp = getMetadata(activity, "follow_up");
  const style = TYPE_STYLES[activity.type];
  const Icon = followUp ? CHANNEL_ICONS[followUp.channel] : style.icon;

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast ? <span aria-hidden className="absolute top-8 bottom-0 left-[13px] w-px bg-border" /> : null}
      <span className={cn("relative flex size-7 shrink-0 items-center justify-center rounded-full ring-1", style.className)}>
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-sm font-medium">{activity.description}</p>
          <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)} className="text-xs text-muted-foreground tabular-nums">
            {formatTime(activity.createdAt)}
          </time>
        </div>
        <ActivityDetail activity={activity} />
        {activity.author ? <p className="mt-1 text-xs text-subtle-foreground">by {activity.author}</p> : null}
      </div>
    </li>
  );
}

function ActivityDetail({ activity }: { activity: Activity }) {
  const status = getMetadata(activity, "status_changed");
  if (status) {
    return (
      <div className="mt-1.5 flex items-center gap-2">
        <StatusBadge status={status.from} />
        <ArrowRight className="size-3 text-subtle-foreground" aria-label="to" />
        <StatusBadge status={status.to} />
      </div>
    );
  }
  const note = getMetadata(activity, "note_added");
  if (note) {
    return (
      <blockquote className="mt-1.5 border-l-2 border-bronze-200 pl-3 text-sm text-muted-foreground">
        {note.excerpt}
      </blockquote>
    );
  }
  const followUp = getMetadata(activity, "follow_up");
  if (followUp) {
    return (
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="sr-only">{FOLLOW_UP_LABELS[followUp.channel]}: </span>
        {followUp.summary}
      </p>
    );
  }
  const created = getMetadata(activity, "contact_created");
  if (created) {
    return (
      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
        Added as <StatusBadge status={created.status} />
      </p>
    );
  }
  return null;
}
