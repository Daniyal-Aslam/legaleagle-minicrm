"use client";

import { useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePersistedBoolean } from "@/hooks/use-persisted-preference";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

/** Desktop/tablet sidebar. Tablets get the icon rail; desktops can collapse. */
export function Sidebar() {
  const isWide = useMediaQuery("(min-width: 1024px)");
  const [userCollapsed, setUserCollapsed] = usePersistedBoolean("legal-eagle-crm:sidebar-collapsed", false);
  const collapsed = !isWide || userCollapsed;

  // Ctrl/⌘ + B toggles the sidebar on desktop (ignored while typing).
  useEffect(() => {
    if (!isWide) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "b" || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      setUserCollapsed(!userCollapsed);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isWide, userCollapsed, setUserCollapsed]);

  const toggleLabel = userCollapsed ? "Expand sidebar" : "Collapse sidebar";
  const ToggleIcon = userCollapsed ? PanelLeftOpen : PanelLeftClose;

  const toggle = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => setUserCollapsed(!userCollapsed)}
          aria-label={toggleLabel}
          aria-expanded={!userCollapsed}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-300 outline-none transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <ToggleIcon className="size-[18px]" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {toggleLabel}
        <kbd className="ml-2 rounded bg-white/15 px-1 font-sans text-2xs">Ctrl B</kbd>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        "sticky top-0 z-40 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]",
      )}
    >
      <div
        className={cn(
          "flex h-[var(--topbar-height)] shrink-0 items-center border-b border-sidebar-border",
          collapsed ? "justify-center" : "justify-between gap-2 pr-2.5 pl-4",
        )}
      >
        <BrandMark collapsed={collapsed} />
        {isWide && !collapsed ? toggle : null}
      </div>

      {isWide && collapsed ? <div className="flex justify-center pt-3">{toggle}</div> : null}

      <div className={cn("flex-1 overflow-y-auto", collapsed ? "px-2.5 py-3" : "px-3 py-4")}>
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className={cn("border-t border-sidebar-border py-3", collapsed ? "flex justify-center px-2.5" : "px-3")}>
        <UserMenu placement="sidebar" collapsed={collapsed} />
      </div>
    </aside>
  );
}
