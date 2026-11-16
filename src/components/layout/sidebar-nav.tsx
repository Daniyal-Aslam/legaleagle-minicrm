"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCrm } from "@/store";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavActive } from "./nav-config";

interface Props {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: Props) {
  const pathname = usePathname();
  const hydrated = useCrm((s) => s.hydration === "ready");
  const contactCount = useCrm((s) => s.contacts.length);

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(item, pathname);
        const Icon = item.icon;
        const link = (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              collapsed && "justify-center px-0",
              active
                ? "bg-sidebar-accent text-white"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
            )}
          >
            {active ? (
              <span
                aria-hidden
                className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-sidebar-primary"
              />
            ) : null}
            <Icon
              className={cn("size-[18px] shrink-0", active ? "text-sidebar-primary" : "text-ink-300 group-hover:text-white")}
              aria-hidden
            />
            {collapsed ? (
              <span className="sr-only">{item.label}</span>
            ) : (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {item.href === "/contacts" && hydrated ? (
                  <span className="rounded-full bg-white/8 px-2 text-2xs leading-5 text-ink-300 tabular-nums">
                    {contactCount}
                  </span>
                ) : null}
              </>
            )}
          </Link>
        );

        return collapsed ? (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          <div key={item.href}>{link}</div>
        );
      })}
    </nav>
  );
}
