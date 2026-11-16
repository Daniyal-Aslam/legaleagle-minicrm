"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DEFAULT_DIRECTION,
  DEFAULT_QUERY,
  isContactStatus,
  isSortKey,
  type ContactQuery,
  type SortKey,
} from "@/lib/contacts/selectors";

function fromParams(params: URLSearchParams): ContactQuery {
  const status = params.get("status");
  const sort = params.get("sort");
  const dir = params.get("dir");
  return {
    search: params.get("q") ?? "",
    status: isContactStatus(status) ? status : "all",
    sort: isSortKey(sort) ? sort : DEFAULT_QUERY.sort,
    direction: dir === "asc" || dir === "desc" ? dir : DEFAULT_QUERY.direction,
  };
}

function toSearchString(query: ContactQuery) {
  const params = new URLSearchParams();
  if (query.search.trim()) params.set("q", query.search.trim());
  if (query.status !== "all") params.set("status", query.status);
  if (query.sort !== DEFAULT_QUERY.sort || query.direction !== DEFAULT_QUERY.direction) {
    params.set("sort", query.sort);
    params.set("dir", query.direction);
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

/**
 * Contact list query state. Results update instantly from local state; the
 * URL is kept in sync (debounced) so filters survive refresh and are shareable.
 */
export function useContactQuery() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<ContactQuery>(() => fromParams(new URLSearchParams(searchParams)));

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = `${window.location.pathname}${toSearchString(query)}`;
      if (next !== `${window.location.pathname}${window.location.search}`) {
        window.history.replaceState(null, "", next);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  return {
    query,
    setSearch: (search: string) => setQuery((q) => ({ ...q, search })),
    setStatus: (status: ContactQuery["status"]) => setQuery((q) => ({ ...q, status })),
    /** Selecting the active key flips direction; a new key uses its natural default. */
    toggleSort: (sort: SortKey) =>
      setQuery((q) => ({
        ...q,
        sort,
        direction: q.sort === sort ? (q.direction === "asc" ? "desc" : "asc") : DEFAULT_DIRECTION[sort],
      })),
    setSort: (sort: SortKey, direction: ContactQuery["direction"]) => setQuery((q) => ({ ...q, sort, direction })),
    reset: () => setQuery((q) => ({ ...DEFAULT_QUERY, sort: q.sort, direction: q.direction })),
  };
}

export type ContactQueryControls = ReturnType<typeof useContactQuery>;
