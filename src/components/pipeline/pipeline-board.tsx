"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusDot } from "@/components/shared/status-badge";
import { changeContactStatus } from "@/components/shared/status-menu";
import { CONTACT_STATUSES, type Contact, type ContactStatus } from "@/types/contact";
import { STATUS_META } from "@/lib/constants";
import { getFullName, isContactStatus } from "@/lib/contacts/selectors";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useCrm, useLatestActivityMap } from "@/store";
import { useUiStore } from "@/store/ui-store";
import { PipelineCardBody } from "./pipeline-card";
import { PipelineColumn } from "./pipeline-column";

// Prefer the column under the pointer; fall back to overlap for keyboard drags.
const collisionDetection: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  return within.length ? within : rectIntersection(args);
};

/** Arrow keys jump a dragged card one stage left/right instead of 25px. */
const stageCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const { collisionRect, droppableRects } = context;
  if (!collisionRect || (event.code !== "ArrowRight" && event.code !== "ArrowLeft")) return undefined;
  event.preventDefault();
  const centerX = collisionRect.left + collisionRect.width / 2;
  const rects = [...droppableRects.values()].sort((a, b) => a.left - b.left);
  const target =
    event.code === "ArrowRight"
      ? rects.find((r) => r.left > centerX)
      : [...rects].reverse().find((r) => r.left + r.width < centerX);
  if (!target) return undefined;
  return { x: target.left + (target.width - collisionRect.width) / 2, y: collisionRect.top };
};

export function PipelineBoard() {
  const hydrated = useCrm((s) => s.hydration === "ready");
  const contacts = useCrm((s) => s.contacts);
  const latestActivity = useLatestActivityMap();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mobileStage, setMobileStage] = useState<ContactStatus>("lead");
  const [dragging, setDragging] = useState<Contact | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: stageCoordinates }),
  );

  const columns = useMemo(() => {
    const grouped: Record<ContactStatus, Contact[]> = { lead: [], active: [], closed: [] };
    for (const contact of contacts) grouped[contact.status].push(contact);
    for (const status of CONTACT_STATUSES) {
      grouped[status].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return grouped;
  }, [contacts]);

  const findName = (id: string | number) => {
    const contact = contacts.find((c) => c.id === id);
    return contact ? getFullName(contact) : "Contact";
  };
  const stageName = (id: string | number | undefined) =>
    isContactStatus(id) ? STATUS_META[id].label : "no stage";

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${findName(active.id)}.`,
    onDragOver: ({ active, over }) => `${findName(active.id)} is over ${stageName(over?.id)}.`,
    onDragEnd: ({ active, over }) =>
      over ? `${findName(active.id)} moved to ${stageName(over.id)}.` : `${findName(active.id)} was dropped. No change.`,
    onDragCancel: ({ active }) => `Moving ${findName(active.id)} was cancelled.`,
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setDragging(contacts.find((c) => c.id === active.id) ?? null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    const contact = contacts.find((c) => c.id === active.id);
    if (contact && over && isContactStatus(over.id)) changeContactStatus(contact, over.id);
  };

  const visibleStatuses = isDesktop ? CONTACT_STATUSES : [mobileStage];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Move contacts through the stages by dragging cards between stages, or use the move menu on any card."
        actions={
          <Button size="lg" onClick={() => useUiStore.getState().openCreateContact()}>
            <Plus aria-hidden />
            Add contact
          </Button>
        }
      />

      {/* Mobile: one stage at a time instead of a cramped horizontal board. */}
      <div role="group" aria-label="Pipeline stage" className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/60 p-1 md:hidden">
        {CONTACT_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={mobileStage === status}
            onClick={() => setMobileStage(status)}
            className={cn(
              "flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35",
              mobileStage === status ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
          >
            <StatusDot status={status} />
            {STATUS_META[status].label}
            <span className="text-xs text-muted-foreground tabular-nums">{hydrated ? columns[status].length : ""}</span>
          </button>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "To move a contact, press space or enter on the drag handle, use the left and right arrow keys to move between stages, then press space or enter to drop. Press escape to cancel.",
          },
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {visibleStatuses.map((status) => (
            <PipelineColumn
              key={status}
              status={status}
              contacts={columns[status]}
              latestActivity={latestActivity}
              loading={!hydrated}
              dragDisabled={!isDesktop}
              isDragActive={dragging !== null}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 160, easing: "ease-out" }}>
          {dragging ? (
            <PipelineCardBody contact={dragging} lastActivity={latestActivity.get(dragging.id)} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
