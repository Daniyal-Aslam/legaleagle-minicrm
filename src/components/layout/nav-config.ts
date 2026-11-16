import { KanbanSquare, LayoutDashboard, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Also active for nested routes, e.g. /contacts/[id]. */
  matchNested?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users, matchNested: true },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
];

export function isNavActive(item: NavItem, pathname: string) {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || (item.matchNested === true && pathname.startsWith(`${item.href}/`));
}
