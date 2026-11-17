"use client";

import { useMemo, useState } from "react";
import { Plus, SearchX, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-panels";
import type { Contact } from "@/types/contact";
import {
  ADDED_LABELS,
  countActiveFilters,
  getContactFacets,
  getStatusCounts,
  queryContacts,
  type ContactQuery,
} from "@/lib/contacts/selectors";
import { CONTACT_SOURCES, MATTER_TYPES, STATUS_META } from "@/lib/constants";
import { pluralize } from "@/lib/utils";
import { useCrm, useLatestActivityMap } from "@/store";
import { useUiStore } from "@/store/ui-store";
import { ContactCardList, ContactCardListSkeleton } from "./contact-card-list";
import { ContactStats } from "./contact-stats";
import { ContactsTable, ContactsTableSkeleton } from "./contacts-table";
import { ContactsToolbar } from "./contacts-toolbar";
import { DeleteContactDialog } from "./delete-contact-dialog";
import { useContactQuery } from "./use-contact-query";

export function ContactsView() {
  const controls = useContactQuery();
  const { query } = controls;
  const hydrated = useCrm((s) => s.hydration === "ready");
  const contacts = useCrm((s) => s.contacts);
  const latestActivity = useLatestActivityMap();
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null);
  const openCreate = useUiStore((s) => s.openCreateContact);

  const counts = useMemo(() => getStatusCounts(contacts), [contacts]);
  const results = useMemo(() => queryContacts(contacts, query), [contacts, query]);
  const facets = useMemo(
    () => getContactFacets(contacts, query, { matters: MATTER_TYPES, sources: CONTACT_SOURCES }),
    [contacts, query],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description={
          hydrated
            ? `${pluralize(counts.all, "contact")} across the pipeline. Search, filter and open a profile to log notes.`
            : "Prospective and existing clients across the pipeline."
        }
        actions={
          <Button onClick={openCreate} size="lg">
            <Plus aria-hidden />
            Add contact
          </Button>
        }
      />

      <ContactStats />

      <section aria-label="Contact list" className="space-y-3">
        <ContactsToolbar
          controls={controls}
          facets={hydrated ? facets : null}
          total={counts.all}
          resultCount={results.length}
        />

        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          {!hydrated ? (
            <>
              <div className="hidden md:block">
                <ContactsTableSkeleton />
              </div>
              <div className="md:hidden">
                <ContactCardListSkeleton />
              </div>
              <span className="sr-only" role="status">
                Loading contacts…
              </span>
            </>
          ) : contacts.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No contacts yet"
              description="Add your first enquiry to start building the pipeline, or restore the sample dataset from your account menu."
              action={
                <Button onClick={openCreate}>
                  <Plus aria-hidden />
                  Add contact
                </Button>
              }
            />
          ) : results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matching contacts"
              description={emptyResultsMessage(query)}
              action={
                <Button variant="outline" onClick={controls.reset}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="hidden md:block">
                <ContactsTable
                  contacts={results}
                  latestActivity={latestActivity}
                  query={query}
                  onSort={controls.toggleSort}
                  onDelete={setPendingDelete}
                />
              </div>
              <div className="md:hidden">
                <ContactCardList contacts={results} latestActivity={latestActivity} onDelete={setPendingDelete} />
              </div>
            </>
          )}
        </div>

      </section>

      <DeleteContactDialog contact={pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)} />
    </div>
  );
}

function emptyResultsMessage(query: ContactQuery) {
  const term = query.search.trim();
  const parts = [
    query.status !== "all" ? STATUS_META[query.status].label.toLowerCase() : null,
    query.matters.length ? query.matters.join(" or ") : null,
    query.sources.length ? `from ${query.sources.join(" or ")}` : null,
    query.added !== "any" ? `added in the ${ADDED_LABELS[query.added].toLowerCase()}` : null,
  ].filter(Boolean);
  const scope = parts.length ? ` among ${parts.join(", ")} contacts` : "";
  if (term) return `Nothing matches “${term}”${scope}. Check the spelling, or search by email, phone or company.`;
  if (countActiveFilters(query) > 1) return `No contacts match all ${countActiveFilters(query)} filters. Try removing one.`;
  return query.status !== "all" && parts.length === 1
    ? `There are no ${parts[0]} contacts right now.`
    : "No contacts match this filter right now.";
}
