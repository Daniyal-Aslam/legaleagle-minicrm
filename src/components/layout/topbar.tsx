"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CURRENT_USER } from "@/lib/constants";
import { getFullName } from "@/lib/contacts/selectors";
import { useCrm } from "@/store";
import { useUiStore } from "@/store/ui-store";
import { BrandMark } from "./brand-mark";
import { NAV_ITEMS, isNavActive } from "./nav-config";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarNav } from "./sidebar-nav";

function Breadcrumbs() {
  const pathname = usePathname();
  const section = NAV_ITEMS.find((item) => isNavActive(item, pathname));
  const contactId = pathname.startsWith("/contacts/") ? pathname.split("/")[2] : undefined;
  const contact = useCrm((s) => (contactId ? s.contacts.find((c) => c.id === contactId) : undefined));

  if (!section) return <span className="font-medium">Not found</span>;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        <li className="shrink-0">
          {contactId ? (
            <Link href={section.href} className="text-muted-foreground hover:text-foreground">
              {section.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-medium text-foreground">
              {section.label}
            </span>
          )}
        </li>
        {contactId ? (
          <>
            <ChevronRight className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
            <li className="min-w-0 truncate font-medium" aria-current="page">
              {contact ? getFullName(contact) : "Contact"}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}

export function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const openQuickFind = () => useUiStore.getState().setQuickFindOpen(true);

  return (
    <header className="sticky top-0 z-30 flex h-[var(--topbar-height)] shrink-0 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="-ml-2 md:hidden"
        aria-label="Open navigation"
        onClick={() => setMenuOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <button
        type="button"
        onClick={openQuickFind}
        className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-3 text-sm text-muted-foreground shadow-xs outline-none transition-colors hover:border-border-strong hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/35 sm:w-64"
      >
        <Search className="size-4" aria-hidden />
        <span className="hidden flex-1 text-left sm:inline">Find a contact…</span>
        <span className="sr-only sm:hidden">Find a contact</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-sans text-2xs leading-5 sm:inline">Ctrl K</kbd>
      </button>

      <div className="flex items-center gap-2.5 pl-1">
        <span
          className="flex size-9 items-center justify-center rounded-full bg-brand-ink font-heading text-xs font-semibold text-brand-gold"
          aria-hidden
        >
          {CURRENT_USER.initials}
        </span>
        <div className="hidden leading-tight xl:block">
          <p className="text-sm font-medium">{CURRENT_USER.name}</p>
          <p className="text-xs text-muted-foreground">{CURRENT_USER.role}</p>
        </div>
        <span className="sr-only">
          Signed in as {CURRENT_USER.name}, {CURRENT_USER.role}
        </span>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:text-white">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Move between CRM sections</SheetDescription>
          <div className="flex h-[var(--topbar-height)] items-center px-4">
            <BrandMark />
          </div>
          <div className="flex-1 px-3 py-4">
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </div>
          <div className="border-t border-sidebar-border p-3">
            <SidebarFooter />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
