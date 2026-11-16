"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Activity } from "@/types/activity";
import type { Contact } from "@/types/contact";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { getFullName, type ContactQuery, type SortKey } from "@/lib/contacts/selectors";
import { cn } from "@/lib/utils";
import { ContactRowActions } from "./contact-row-actions";

interface Props {
  contacts: Contact[];
  latestActivity: Map<string, Activity>;
  query: ContactQuery;
  onSort: (key: SortKey) => void;
  onDelete: (contact: Contact) => void;
}

/** Ignore row clicks that originate from interactive children. */
function isFromInteractive(event: MouseEvent) {
  return (event.target as HTMLElement).closest("a,button,[role=menuitem],[role=menu]") !== null;
}

export function ContactsTable({ contacts, latestActivity, query, onSort, onDelete }: Props) {
  const router = useRouter();

  return (
    <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
      <caption className="sr-only">
        Contacts, sorted by {query.sort} {query.direction === "asc" ? "ascending" : "descending"}
      </caption>
      <TableHead query={query} onSort={onSort} />
      <tbody>
        {contacts.map((contact) => {
          const activity = latestActivity.get(contact.id);
          return (
            <tr
              key={contact.id}
              onClick={(e) => !isFromInteractive(e) && router.push(`/contacts/${contact.id}`)}
              className="group cursor-pointer transition-colors hover:bg-bronze-50/60"
            >
              <Td>
                <div className="flex min-w-0 items-center gap-3">
                  <ContactAvatar contact={contact} />
                  <div className="min-w-0">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="block truncate font-medium text-foreground outline-none group-hover:text-bronze-800 focus-visible:underline"
                    >
                      {getFullName(contact)}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{contact.company ?? "Individual"}</p>
                  </div>
                </div>
              </Td>
              <Td className="hidden truncate text-muted-foreground lg:table-cell">
                <span title={contact.email}>{contact.email}</span>
              </Td>
              <Td className="hidden whitespace-nowrap text-muted-foreground tabular-nums xl:table-cell">{contact.phone}</Td>
              <Td>
                <StatusBadge status={contact.status} />
              </Td>
              <Td className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">
                <time dateTime={contact.createdAt}>{formatDate(contact.createdAt)}</time>
              </Td>
              <Td>
                {activity ? (
                  <div className="min-w-0">
                    <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)} className="block text-foreground">
                      {formatRelative(activity.createdAt)}
                    </time>
                    <p className="truncate text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                ) : (
                  <span className="text-subtle-foreground">—</span>
                )}
              </Td>
              <Td className="pr-3 text-right">
                <ContactRowActions contact={contact} onDelete={onDelete} />
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const COLUMNS: { label: string; sort?: SortKey; className?: string }[] = [
  // Tablet keeps the essentials; email, phone and date added appear as space allows.
  { label: "Contact", sort: "name", className: "w-[40%] pl-5 lg:w-[30%] xl:w-[24%]" },
  { label: "Email", className: "hidden lg:table-cell lg:w-[27%] xl:w-[22%]" },
  { label: "Phone", className: "hidden xl:table-cell xl:w-[15%]" },
  { label: "Status", sort: "status", className: "w-[20%] lg:w-[14%] xl:w-[11%]" },
  { label: "Date added", sort: "createdAt", className: "hidden xl:table-cell xl:w-[11%]" },
  { label: "Last activity", sort: "updatedAt", className: "w-[32%] lg:w-[22%] xl:w-[17%]" },
  { label: "Actions", className: "w-14" },
];

function TableHead({ query, onSort }: { query: ContactQuery; onSort: (key: SortKey) => void }) {
  return (
    <thead>
      <tr>
        {COLUMNS.map((column) => {
          const active = column.sort === query.sort;
          return (
            <th
              key={column.label}
              scope="col"
              aria-sort={active ? (query.direction === "asc" ? "ascending" : "descending") : undefined}
              className={cn(
                "sticky top-0 h-11 border-b bg-muted/50 px-3 text-left text-xs font-medium text-muted-foreground",
                column.className,
              )}
            >
              {column.label === "Actions" ? (
                <span className="sr-only">Actions</span>
              ) : column.sort ? (
                <button
                  type="button"
                  onClick={() => onSort(column.sort!)}
                  className={cn(
                    "-mx-1.5 inline-flex h-7 cursor-pointer items-center gap-1 rounded px-1.5 whitespace-nowrap outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                    active && "text-foreground",
                  )}
                >
                  {column.label}
                  {active ? (
                    query.direction === "asc" ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />
                  ) : (
                    <ChevronsUpDown className="size-3 opacity-50" aria-hidden />
                  )}
                </button>
              ) : (
                column.label
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("h-16 border-b px-3 align-middle group-last:border-b-0 first:pl-5", className)}>{children}</td>
  );
}

export function ContactsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-hidden className="divide-y">
      <div className="h-11 bg-muted/50" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-16 items-center gap-3 px-5">
          <Skeleton className="size-9 rounded-full" />
          <div className="w-[22%] space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3.5 w-[20%]" />
          <Skeleton className="ml-auto h-6 w-16 rounded-full" />
          <Skeleton className="h-3.5 w-[14%]" />
        </div>
      ))}
    </div>
  );
}
