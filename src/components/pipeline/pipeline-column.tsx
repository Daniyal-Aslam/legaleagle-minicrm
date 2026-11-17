"use client";

import { useDroppable } from "@dnd-kit/core";
import { Archive, Inbox, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/state-panels";
import { StatusDot } from "@/components/shared/status-badge";
import type { Activity } from "@/types/activity";
import type { Contact, ContactStatus } from "@/types/contact";
import { STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { DraggablePipelineCard } from "./pipeline-card";

const EMPTY_COPY: Record<ContactStatus, { icon: typeof Inbox; title: string; description: string }> = {
  lead: { icon: Inbox, title: "No open leads", description: "New enquiries land here. Add a contact to get started." },
  active: { icon: UserCheck, title: "No active clients", description: "Drag a qualified lead here, or use its move menu." },
  closed: { icon: Archive, title: "Nothing closed yet", description: "Concluded or declined engagements will collect here." },
};

interface Props {
  status: ContactStatus;
  contacts: Contact[];
  latestActivity: Map<string, Activity>;
  loading: boolean;
  dragDisabled: boolean;
  isDragActive: boolean;
}

export function PipelineColumn({ status, contacts, latestActivity, loading, dragDisabled, isDragActive }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const headingId = `pipeline-${status}-heading`;
  const empty = EMPTY_COPY[status];

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={cn(
        "flex min-h-[28rem] min-w-0 flex-col rounded-xl border bg-muted/50 transition-colors",
        isDragActive && "border-dashed",
        isOver && "border-brand-bronze bg-bronze-50/70",
      )}
    >
      <header className="flex items-center gap-2 px-4 pt-4 pb-3">
        <StatusDot status={status} className="size-2" />
        <h2 id={headingId} className="text-md font-semibold">
          {STATUS_META[status].label}
        </h2>
        <span className="rounded-full bg-card px-2 text-xs leading-5 font-medium text-muted-foreground tabular-nums ring-1 ring-border">
          {loading ? "…" : contacts.length}
        </span>
        <p className="ml-auto hidden truncate text-xs text-muted-foreground xl:block">{STATUS_META[status].description}</p>
      </header>

      <div className="flex-1 px-3 pb-3">
        {loading ? (
          <div className="space-y-2.5" aria-hidden>
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[116px] rounded-lg bg-card" />
            ))}
          </div>
        ) : contacts.length ? (
          <ul className="space-y-2.5">
            {contacts.map((contact) => (
              <DraggablePipelineCard
                key={contact.id}
                contact={contact}
                lastActivity={latestActivity.get(contact.id)}
                dragDisabled={dragDisabled}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={empty.icon}
            title={empty.title}
            description={empty.description}
            className="h-full rounded-lg border border-dashed bg-card/60"
          />
        )}
      </div>
    </section>
  );
}
