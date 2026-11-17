import type { Activity } from "@/types/activity";
import { CONTACT_STATUSES, type Contact, type ContactStatus } from "@/types/contact";

export type StatusFilter = ContactStatus | "all";
export const SORT_KEYS = ["name", "createdAt", "updatedAt", "status"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";

export const ADDED_WINDOWS = ["any", "7d", "30d", "90d"] as const;
export type AddedWindow = (typeof ADDED_WINDOWS)[number];

export const ADDED_LABELS: Record<AddedWindow, string> = {
  any: "Any time",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const ADDED_DAYS: Record<Exclude<AddedWindow, "any">, number> = { "7d": 7, "30d": 30, "90d": 90 };

/** Shown (and filtered on) for contacts without a practice area / source. */
export const UNSPECIFIED = "Not specified";

export interface ContactQuery {
  search: string;
  status: StatusFilter;
  /** Practice areas to include; empty means all. */
  matters: string[];
  /** Lead sources to include; empty means all. */
  sources: string[];
  added: AddedWindow;
  sort: SortKey;
  direction: SortDirection;
}

export const DEFAULT_QUERY: ContactQuery = {
  search: "",
  status: "all",
  matters: [],
  sources: [],
  added: "any",
  sort: "updatedAt",
  direction: "desc",
};

/** Number of narrowing filters applied besides search (status counts as one). */
export function countActiveFilters(query: ContactQuery) {
  return (
    (query.status !== "all" ? 1 : 0) +
    query.matters.length +
    query.sources.length +
    (query.added !== "any" ? 1 : 0)
  );
}

export function isFiltered(query: ContactQuery) {
  return query.search.trim() !== "" || countActiveFilters(query) > 0;
}

export const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  createdAt: "Date added",
  updatedAt: "Last updated",
  status: "Status",
};

/** The natural first direction when a user picks a sort key. */
export const DEFAULT_DIRECTION: Record<SortKey, SortDirection> = {
  name: "asc",
  createdAt: "desc",
  updatedAt: "desc",
  status: "asc",
};

export function getFullName(contact: Pick<Contact, "firstName" | "lastName">) {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

export function getInitials(contact: Pick<Contact, "firstName" | "lastName">) {
  return `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

export function matchesSearch(contact: Contact, rawTerm: string) {
  const term = normalize(rawTerm.trim());
  if (!term) return true;
  const haystack = normalize(
    [getFullName(contact), contact.email, contact.company ?? "", contact.phone].join(" "),
  );
  if (haystack.includes(term)) return true;
  // Phone searches ignore formatting: "0501234" matches "+971 50 123 4567".
  const digits = term.replace(/\D/g, "");
  return digits.length >= 3 && contact.phone.replace(/\D/g, "").includes(digits);
}

const STATUS_ORDER: Record<ContactStatus, number> = { lead: 0, active: 1, closed: 2 };

export function compareContacts(a: Contact, b: Contact, sort: SortKey): number {
  switch (sort) {
    case "name":
      return getFullName(a).localeCompare(getFullName(b), "en", { sensitivity: "base" });
    case "createdAt":
      return a.createdAt.localeCompare(b.createdAt);
    case "updatedAt":
      return a.updatedAt.localeCompare(b.updatedAt);
    case "status":
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  }
}

const matterOf = (c: Contact) => c.matterType?.trim() || UNSPECIFIED;
const sourceOf = (c: Contact) => c.source?.trim() || UNSPECIFIED;

function addedWithin(contact: Contact, added: AddedWindow, now: Date) {
  if (added === "any") return true;
  const cutoff = now.getTime() - ADDED_DAYS[added] * 24 * 60 * 60 * 1000;
  return new Date(contact.createdAt).getTime() >= cutoff;
}

type Facet = "status" | "matters" | "sources";

/** Applies every filter except `skip`, so a facet's option counts reflect the other filters. */
function filterContacts(contacts: Contact[], query: ContactQuery, now: Date, skip?: Facet) {
  return contacts.filter(
    (c) =>
      (skip === "status" || query.status === "all" || c.status === query.status) &&
      (skip === "matters" || query.matters.length === 0 || query.matters.includes(matterOf(c))) &&
      (skip === "sources" || query.sources.length === 0 || query.sources.includes(sourceOf(c))) &&
      addedWithin(c, query.added, now) &&
      matchesSearch(c, query.search),
  );
}

export function queryContacts(contacts: Contact[], query: ContactQuery, now: Date = new Date()): Contact[] {
  const factor = query.direction === "asc" ? 1 : -1;
  return filterContacts(contacts, query, now)
    .sort(
      (a, b) =>
        compareContacts(a, b, query.sort) * factor ||
        // Stable, predictable tie-break by name.
        compareContacts(a, b, "name"),
    );
}

export type StatusCounts = Record<ContactStatus | "all", number>;

export function getStatusCounts(contacts: Contact[]): StatusCounts {
  const counts: StatusCounts = { all: contacts.length, lead: 0, active: 0, closed: 0 };
  for (const contact of contacts) counts[contact.status] += 1;
  return counts;
}

export interface FacetOption {
  value: string;
  count: number;
}

export interface ContactFacets {
  status: StatusCounts;
  matters: FacetOption[];
  sources: FacetOption[];
}

function tally(values: string[], known: readonly string[], selected: string[]): FacetOption[] {
  const counts = new Map<string, number>(known.map((v) => [v, 0]));
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  // Keep selected options visible even when other filters leave them at zero.
  for (const v of selected) if (!counts.has(v)) counts.set(v, 0);
  return [...counts]
    .filter(([value, count]) => count > 0 || selected.includes(value) || (known.includes(value) && value !== UNSPECIFIED))
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => (a.value === UNSPECIFIED ? 1 : b.value === UNSPECIFIED ? -1 : 0));
}

/** Option counts for each filter, given the other active filters (faceted search). */
export function getContactFacets(
  contacts: Contact[],
  query: ContactQuery,
  options: { matters: readonly string[]; sources: readonly string[] },
  now: Date = new Date(),
): ContactFacets {
  return {
    status: getStatusCounts(filterContacts(contacts, query, now, "status")),
    matters: tally(filterContacts(contacts, query, now, "matters").map(matterOf), options.matters, query.matters),
    sources: tally(filterContacts(contacts, query, now, "sources").map(sourceOf), options.sources, query.sources),
  };
}

/** Most recent activity per contact, used for "Last activity" columns. */
export function getLatestActivityByContact(activities: Activity[]) {
  const latest = new Map<string, Activity>();
  for (const activity of activities) {
    const current = latest.get(activity.contactId);
    if (!current || activity.createdAt > current.createdAt) latest.set(activity.contactId, activity);
  }
  return latest;
}

export function isContactStatus(value: unknown): value is ContactStatus {
  return typeof value === "string" && (CONTACT_STATUSES as readonly string[]).includes(value);
}

export function isAddedWindow(value: unknown): value is AddedWindow {
  return typeof value === "string" && (ADDED_WINDOWS as readonly string[]).includes(value);
}

export function isSortKey(value: unknown): value is SortKey {
  return typeof value === "string" && (SORT_KEYS as readonly string[]).includes(value);
}
