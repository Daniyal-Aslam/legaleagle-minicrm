"use client";

import { useState } from "react";
import { FlaskConical, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCrm } from "@/store";
import { cn } from "@/lib/utils";
import { ResetDemoDialog } from "./reset-demo-dialog";

const PERSISTENCE_COPY = {
  ok: "Data is saved in this browser only.",
  unavailable: "Browser storage is blocked — changes last for this session only.",
  failed: "The last change couldn't be saved to this browser.",
} as const;

export function SidebarFooter({ collapsed = false }: { collapsed?: boolean }) {
  const [resetOpen, setResetOpen] = useState(false);
  const persistence = useCrm((s) => s.persistence);

  const resetButton = (
    <button
      type="button"
      onClick={() => setResetOpen(true)}
      className={cn(
        "flex h-9 cursor-pointer items-center gap-2 rounded-md text-xs font-medium text-sidebar-foreground outline-none transition-colors",
        "hover:bg-sidebar-accent hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        collapsed ? "w-10 justify-center" : "w-full px-2.5",
      )}
    >
      <RotateCcw className="size-3.5" aria-hidden />
      {collapsed ? <span className="sr-only">Reset demo data</span> : "Reset demo data"}
    </button>
  );

  return (
    <>
      {collapsed ? (
        <div className="flex flex-col items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                className="flex size-8 items-center justify-center rounded-md bg-brand-gold/12 text-brand-gold outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <FlaskConical className="size-4" aria-hidden />
                <span className="sr-only">Demo environment</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">Demo environment · {PERSISTENCE_COPY[persistence]}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>{resetButton}</TooltipTrigger>
            <TooltipContent side="right">Reset demo data</TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-3.5 text-brand-gold" aria-hidden />
            <p className="text-xs font-semibold text-white">Demo environment</p>
          </div>
          <p
            className={cn(
              "mt-1 text-2xs leading-4",
              persistence === "ok" ? "text-ink-300" : "text-brand-gold",
            )}
          >
            Fictional data. {PERSISTENCE_COPY[persistence]}
          </p>
          <div className="mt-2 -mx-1">{resetButton}</div>
        </div>
      )}
      <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} />
    </>
  );
}
