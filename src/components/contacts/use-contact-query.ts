"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DEFAULT_DIRECTION,
  DEFAULT_QUERY,
  isAddedWindow,
  isContactStatus,
  isSortKey,
  type ContactQuery,
  type SortKey,
} from "@/lib/contacts/selectors";

const unique = (values: string[]) => [...new Set(values.map((v) => v.trim()).filter(Boolean))];

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

function fromParams(params: URLSearchParams): ContactQuery {
  const status = params.get("status");
  const sort = params.get("sort");
  const dir = params.get("dir");
  return {
    search: params.get("q") ?? "",
    status: isContactStatus(status) ? status : "all",
    matters: unique(params.getAll("matter")),
    sources: unique(params.getAll("source")),
    added: isAddedWindow(params.get("added")) ? (params.get("added") as ContactQuery["added"]) : "any",
    sort: isSortKey(sort) ? sort : DEFAULT_QUERY.sort,
    direction: dir === "asc" || dir === "desc" ? dir : DEFAULT_QUERY.direction,
  };
}

function toSearchString(query: ContactQuery) {
  const params = new URLSearchParams();
  if (query.search.trim()) params.set("q", query.search.trim());
  if (query.status !== "all") params.set("status", query.status);
  for (const matter of query.matters) params.append("matter", matter);
  for (const source of query.sources) params.append("source", source);
  if (query.added !== "any") params.set("added", query.added);
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
    toggleMatter: (matter: string) => setQuery((q) => ({ ...q, matters: toggle(q.matters, matter) })),
    toggleSource: (source: string) => setQuery((q) => ({ ...q, sources: toggle(q.sources, source) })),
    clearMatters: () => setQuery((q) => ({ ...q, matters: [] })),
    clearSources: () => setQuery((q) => ({ ...q, sources: [] })),
    setAdded: (added: ContactQuery["added"]) => setQuery((q) => ({ ...q, added })),
    /** Selecting the active key flips direction; a new key uses its natural default. */
    toggleSort: (sort: SortKey) =>
      setQuery((q) => ({
        ...q,
        sort,
        direction: q.sort === sort ? (q.direction === "asc" ? "desc" : "asc") : DEFAULT_DIRECTION[sort],
      })),
    setSort: (sort: SortKey, direction: ContactQuery["direction"]) => setQuery((q) => ({ ...q, sort, direction })),
    /** Clears search and every filter; keeps the chosen sort. */
    reset: () => setQuery((q) => ({ ...DEFAULT_QUERY, sort: q.sort, direction: q.direction })),
  };
}

export type ContactQueryControls = ReturnType<typeof useContactQuery>;
