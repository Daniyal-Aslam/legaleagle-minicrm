import type { Activity } from "@/types/activity";
import { CONTACT_STATUSES, type Contact, type ContactStatus } from "@/types/contact";

export type StatusFilter = ContactStatus | "all";
export const SORT_KEYS = ["name", "createdAt", "updatedAt", "status"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";

export interface ContactQuery {
  search: string;
  status: StatusFilter;
  sort: SortKey;
  direction: SortDirection;
}

export const DEFAULT_QUERY: ContactQuery = {
  search: "",
  status: "all",
  sort: "updatedAt",
  direction: "desc",
};

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

export function queryContacts(contacts: Contact[], query: ContactQuery): Contact[] {
  const factor = query.direction === "asc" ? 1 : -1;
  return contacts
    .filter((c) => query.status === "all" || c.status === query.status)
    .filter((c) => matchesSearch(c, query.search))
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

export function isSortKey(value: unknown): value is SortKey {
  return typeof value === "string" && (SORT_KEYS as readonly string[]).includes(value);
}
