"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePersistedBoolean } from "@/hooks/use-persisted-preference";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarNav } from "./sidebar-nav";

/** Desktop/tablet sidebar. Tablets get the icon rail; desktops can collapse. */
export function Sidebar() {
  const isWide = useMediaQuery("(min-width: 1024px)");
  const [userCollapsed, setUserCollapsed] = usePersistedBoolean("legal-eagle-crm:sidebar-collapsed", false);
  const collapsed = !isWide || userCollapsed;

  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]",
      )}
    >
      <div className={cn("flex h-[var(--topbar-height)] items-center", collapsed ? "justify-center" : "px-4")}>
        <BrandMark collapsed={collapsed} />
      </div>

      <div className={cn("flex-1 overflow-y-auto py-4", collapsed ? "px-2.5" : "px-3")}>
        {!collapsed ? (
          <p className="mb-2 px-3 text-2xs font-semibold tracking-[0.12em] text-ink-500 uppercase">Workspace</p>
        ) : null}
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className={cn("space-y-2 border-t border-sidebar-border py-3", collapsed ? "px-2.5" : "px-3")}>
        <SidebarFooter collapsed={collapsed} />
        {isWide ? (
          <button
            type="button"
            onClick={() => setUserCollapsed(!userCollapsed)}
            aria-label={userCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex h-9 w-full cursor-pointer items-center gap-2 rounded-md text-xs text-ink-300 outline-none transition-colors",
              "hover:bg-sidebar-accent hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              collapsed ? "justify-center" : "px-2.5",
            )}
          >
            {userCollapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="size-4" aria-hidden />
                Collapse
              </>
            )}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
