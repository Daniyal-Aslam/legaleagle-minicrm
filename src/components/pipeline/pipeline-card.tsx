"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { ArrowRightLeft, GripVertical, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { StatusMenu } from "@/components/shared/status-menu";
import type { Activity } from "@/types/activity";
import type { Contact } from "@/types/contact";
import { formatDateTime, formatRelative } from "@/lib/format";
import { getFullName } from "@/lib/contacts/selectors";
import { cn } from "@/lib/utils";

interface CardProps {
  contact: Contact;
  lastActivity?: Activity;
}

export function DraggablePipelineCard({ contact, lastActivity, dragDisabled }: CardProps & { dragDisabled: boolean }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: contact.id,
    data: { contact },
    disabled: dragDisabled,
  });

  return (
    <li
      ref={setNodeRef}
      // Pointer drags start anywhere on the card; keyboard drags start from the handle.
      onPointerDown={(event) => listeners?.onPointerDown?.(event)}
      className={cn("list-none", !dragDisabled && "cursor-grab active:cursor-grabbing", isDragging && "opacity-40")}
    >
      <PipelineCardBody
        contact={contact}
        lastActivity={lastActivity}
        handle={
          dragDisabled ? null : (
            <button
              type="button"
              {...attributes}
              onKeyDown={(event) => listeners?.onKeyDown?.(event)}
              aria-label={`Drag ${getFullName(contact)} to another stage`}
              className="flex size-7 cursor-grab items-center justify-center rounded text-subtle-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <GripVertical className="size-4" aria-hidden />
            </button>
          )
        }
      />
    </li>
  );
}

export function PipelineCardBody({
  contact,
  lastActivity,
  handle,
  overlay,
}: CardProps & { handle?: React.ReactNode; overlay?: boolean }) {
  return (
    <article
      aria-label={getFullName(contact)}
      className={cn(
        "group rounded-lg border bg-card p-3.5 shadow-xs transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-sm",
        overlay && "rotate-[1.5deg] border-brand-bronze/40 shadow-lg",
      )}
    >
      <div className="flex items-start gap-3">
        <ContactAvatar contact={contact} size="sm" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/contacts/${contact.id}`}
            className="block truncate text-sm font-medium outline-none hover:text-bronze-800 focus-visible:underline"
            draggable={false}
          >
            {getFullName(contact)}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{contact.company ?? contact.email}</p>
        </div>
        <div className="-mt-1 -mr-1.5 flex shrink-0 items-center">
          {handle}
          {!overlay ? (
            <StatusMenu contact={contact} align="end">
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-7"
                aria-label={`Move ${getFullName(contact)} to another stage`}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <ArrowRightLeft className="size-3.5" />
              </Button>
            </StatusMenu>
          ) : null}
        </div>
      </div>

      {contact.matterType ? (
        <p className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-2xs font-medium text-muted-foreground">
          <Scale className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{contact.matterType}</span>
        </p>
      ) : null}

      <p className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5 text-2xs text-muted-foreground">
        <span className="truncate">{lastActivity ? lastActivity.description : "No activity"}</span>
        {lastActivity ? (
          <time dateTime={lastActivity.createdAt} title={formatDateTime(lastActivity.createdAt)} className="shrink-0 tabular-nums">
            {formatRelative(lastActivity.createdAt)}
          </time>
        ) : null}
      </p>
    </article>
  );
}
