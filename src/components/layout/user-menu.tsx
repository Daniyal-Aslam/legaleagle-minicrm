"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Loader2, LogOut, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSessionUser } from "@/components/auth/session-provider";
import { cn } from "@/lib/utils";
import { ResetDemoDialog } from "./reset-demo-dialog";

function useSignOut() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.replace("/login");
      router.refresh();
    } catch {
      setSigningOut(false);
      toast.error("Couldn't sign out", { description: "Check your connection and try again." });
    }
  };

  return { signOut, signingOut };
}

interface Props {
  /** "topbar": compact avatar trigger. "sidebar": profile card pinned to the sidebar footer. */
  placement?: "topbar" | "sidebar";
  /** Sidebar only: render as an icon rail. */
  collapsed?: boolean;
}

export function UserMenu({ placement = "topbar", collapsed = false }: Props) {
  const user = useSessionUser();
  const { signOut, signingOut } = useSignOut();
  const [resetOpen, setResetOpen] = useState(false);
  const inSidebar = placement === "sidebar";

  const avatar = (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-xs font-semibold",
        inSidebar ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-brand-ink text-brand-gold",
      )}
      aria-hidden
    >
      {user.initials}
    </span>
  );

  const menu = (
    <DropdownMenu>
      {inSidebar ? (
        <DropdownMenuTrigger
          className={cn(
            "flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg p-1.5 text-left outline-none transition-colors",
            "hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent",
            collapsed ? "justify-center" : "flex-1",
          )}
          aria-label={`Account menu for ${user.name}`}
        >
          {avatar}
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-medium text-white">{user.name.split(" ")[0]}</span>
                <span className="block truncate text-2xs text-ink-300">{user.role}</span>
              </span>
            </>
          ) : null}
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger
          className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1 pr-1.5 pl-1 outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/35"
          aria-label={`Account menu for ${user.name}`}
        >
          {avatar}
          <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" aria-hidden />
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        side={inSidebar ? (collapsed ? "right" : "top") : "bottom"}
        align={inSidebar && collapsed ? "end" : inSidebar ? "start" : "end"}
        // Collapsed: clear the rail's padding so the menu sits just outside the sidebar.
        sideOffset={inSidebar && collapsed ? 20 : 8}
        collisionPadding={12}
        className={cn(
          // Expanded sidebar: span the footer row exactly (sidebar width minus px-3 padding and the 1px border).
          inSidebar && !collapsed ? "w-[calc(var(--sidebar-width)-1.5rem-1px)]" : "w-60",
        )}
      >
        <DropdownMenuLabel className="flex items-center gap-2.5 px-2 py-2 font-normal">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-ink font-heading text-2xs font-semibold text-brand-gold">
            {user.initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-2xs text-muted-foreground">{user.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setResetOpen(true)}>
          <RotateCcw aria-hidden />
          Reset sample data
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={signOut} disabled={signingOut}>
          <LogOut aria-hidden />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {inSidebar && !collapsed ? (
        <div className="flex items-center gap-1">
          {menu}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                aria-label="Sign out"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-300 outline-none transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:cursor-wait"
              >
                {signingOut ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Sign out</TooltipContent>
          </Tooltip>
        </div>
      ) : (
        menu
      )}
      <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} />
    </>
  );
}
