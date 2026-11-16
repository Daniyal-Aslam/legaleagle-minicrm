"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { getFullName, queryContacts, DEFAULT_QUERY } from "@/lib/contacts/selectors";
import { useCrm } from "@/store";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 8;

export function QuickFind() {
  const open = useUiStore((s) => s.quickFindOpen);
  const setOpen = useUiStore((s) => s.setQuickFindOpen);

  // Global Ctrl/⌘ + K shortcut.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!useUiStore.getState().quickFindOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="top-[18%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Find a contact</DialogTitle>
        <DialogDescription className="sr-only">
          Search by name, email, phone or company. Use the arrow keys to move and Enter to open.
        </DialogDescription>
        {/* Remount on open so the query resets without effects. */}
        {open ? <QuickFindBody onClose={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function QuickFindBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const contacts = useCrm((s) => s.contacts);
  const [term, setTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(
    () => queryContacts(contacts, { ...DEFAULT_QUERY, search: term }).slice(0, MAX_RESULTS),
    [contacts, term],
  );
  const safeIndex = Math.min(activeIndex, Math.max(results.length - 1, 0));

  const go = (id: string) => {
    onClose();
    router.push(`/contacts/${id}`);
  };

  return (
    <div>
      <div className="flex items-center gap-3 border-b px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          autoFocus
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && results[safeIndex]) {
              e.preventDefault();
              go(results[safeIndex].id);
            }
          }}
          placeholder="Find a contact by name, email, phone or company…"
          aria-label="Search contacts"
          role="combobox"
          aria-expanded
          aria-controls="quick-find-results"
          aria-activedescendant={results[safeIndex] ? `qf-${results[safeIndex].id}` : undefined}
          className="h-13 w-full bg-transparent text-md outline-none placeholder:text-subtle-foreground"
        />
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground sm:inline">Esc</kbd>
      </div>

      {results.length ? (
        <ul id="quick-find-results" role="listbox" aria-label="Contacts" className="max-h-80 overflow-y-auto p-2">
          {results.map((contact, index) => (
            <li
              key={contact.id}
              id={`qf-${contact.id}`}
              role="option"
              aria-selected={index === safeIndex}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => go(contact.id)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2",
                index === safeIndex && "bg-accent",
              )}
            >
              <ContactAvatar contact={contact} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{getFullName(contact)}</p>
                <p className="truncate text-xs text-muted-foreground">{contact.company ?? contact.email}</p>
              </div>
              <StatusBadge status={contact.status} />
              {index === safeIndex ? (
                <CornerDownLeft className="hidden size-3.5 text-muted-foreground sm:block" aria-hidden />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <UserRound className="size-5 text-subtle-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">No contacts match “{term}”.</p>
        </div>
      )}
    </div>
  );
}
