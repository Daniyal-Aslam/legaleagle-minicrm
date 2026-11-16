import type { ContactStatus } from "@/types/contact";
import { STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const STATUS_STYLES: Record<ContactStatus, { badge: string; dot: string; text: string }> = {
  lead: {
    badge: "bg-status-lead-bg text-status-lead-fg",
    dot: "bg-status-lead-dot",
    text: "text-status-lead-fg",
  },
  active: {
    badge: "bg-status-active-bg text-status-active-fg",
    dot: "bg-status-active-dot",
    text: "text-status-active-fg",
  },
  closed: {
    badge: "bg-status-closed-bg text-status-closed-fg",
    dot: "bg-status-closed-dot",
    text: "text-status-closed-fg",
  },
};

export function StatusDot({ status, className }: { status: ContactStatus; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-1.5 shrink-0 rounded-full", STATUS_STYLES[status].dot, className)}
    />
  );
}

export function StatusBadge({ status, className }: { status: ContactStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status].badge,
        className,
      )}
    >
      <StatusDot status={status} />
      {STATUS_META[status].label}
    </span>
  );
}
