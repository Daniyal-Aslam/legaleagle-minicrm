"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { StatusDot } from "@/components/shared/status-badge";
import { STATUS_META } from "@/lib/constants";
import {
  SORT_KEYS,
  SORT_LABELS,
  type SortDirection,
  type StatusCounts,
  type StatusFilter,
} from "@/lib/contacts/selectors";
import { cn } from "@/lib/utils";
import type { ContactQueryControls } from "./use-contact-query";

const FILTERS: StatusFilter[] = ["all", "lead", "active", "closed"];

interface Props {
  controls: ContactQueryControls;
  counts: StatusCounts | null;
}

export function ContactsToolbar({ controls, counts }: Props) {
  const { query, setSearch, setStatus, setSort } = controls;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div
        role="group"
        aria-label="Filter by status"
        className="grid w-full grid-cols-4 gap-1 rounded-lg border bg-muted/60 p-1 lg:flex lg:w-auto"
      >
        {FILTERS.map((filter) => {
          const active = query.status === filter;
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(filter)}
              className={cn(
                "flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-1.5 sm:gap-2 sm:px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors lg:flex-none",
                "focus-visible:ring-[3px] focus-visible:ring-ring/35",
                active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter !== "all" ? <StatusDot status={filter} className="hidden sm:inline-block" /> : null}
              {filter === "all" ? "All" : STATUS_META[filter].label}
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-2xs leading-5 tabular-nums",
                  active ? "bg-bronze-50 text-bronze-800" : "bg-border/70 text-muted-foreground",
                )}
              >
                {counts ? counts[filter] : "–"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 lg:w-80 lg:flex-none">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={query.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, company"
            aria-label="Search contacts"
            className="h-10 bg-card pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
          />
          {query.search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 shrink-0" aria-label={`Sort by ${SORT_LABELS[query.sort]}, ${query.direction === "asc" ? "ascending" : "descending"}`}>
              {query.direction === "asc" ? <ArrowUpNarrowWide aria-hidden /> : <ArrowDownWideNarrow aria-hidden />}
              <span className="hidden sm:inline">{SORT_LABELS[query.sort]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={query.sort}
              onValueChange={(value) => setSort(value as (typeof SORT_KEYS)[number], query.direction)}
            >
              {SORT_KEYS.map((key) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Order</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={query.direction}
              onValueChange={(value) => setSort(query.sort, value as SortDirection)}
            >
              <DropdownMenuRadioItem value="asc">{directionLabel(query.sort, "asc")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="desc">{directionLabel(query.sort, "desc")}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function directionLabel(sort: (typeof SORT_KEYS)[number], direction: SortDirection) {
  if (sort === "name") return direction === "asc" ? "A → Z" : "Z → A";
  if (sort === "status") return direction === "asc" ? "Lead → Closed" : "Closed → Lead";
  return direction === "asc" ? "Oldest first" : "Newest first";
}
