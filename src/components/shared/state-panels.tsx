import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-16",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-bronze-50 text-brand-bronze ring-1 ring-bronze-100",
          compact ? "size-9" : "size-12",
        )}
      >
        <Icon className={compact ? "size-4" : "size-5"} aria-hidden />
      </span>
      <div className="space-y-1">
        <p className={cn("font-heading font-semibold text-foreground", compact ? "text-base" : "text-lg")}>
          {title}
        </p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't display this page. Your saved data has not been affected.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 px-6 py-16 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive-soft text-destructive ring-1 ring-destructive/15">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-heading text-lg font-semibold">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="mt-1 flex gap-2">{action}</div> : null}
    </div>
  );
}
