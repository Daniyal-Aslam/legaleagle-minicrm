"use client";

import { useEffect, useRef } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CalendarDays,
  ChevronDown,
  Megaphone,
  Scale,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
  ADDED_LABELS,
  ADDED_WINDOWS,
  SORT_KEYS,
  SORT_LABELS,
  isFiltered,
  type AddedWindow,
  type ContactFacets,
  type FacetOption,
  type SortDirection,
  type StatusFilter,
} from "@/lib/contacts/selectors";
import { cn, pluralize } from "@/lib/utils";
import type { ContactQueryControls } from "./use-contact-query";

const STATUS_FILTERS: StatusFilter[] = ["all", "lead", "active", "closed"];

interface Props {
  controls: ContactQueryControls;
  /** Null until data has loaded. */
  facets: ContactFacets | null;
  total: number;
  resultCount: number;
}

export function ContactsToolbar({ controls, facets, total, resultCount }: Props) {
  const { query } = controls;
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = isFiltered(query);

  // "/" jumps to search, like most list views.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='dialog'], [role='menu']")) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...query.matters.map((m) => ({
      key: `m:${m}`,
      label: m,
      onRemove: () => controls.toggleMatter(m),
    })),
    ...query.sources.map((s) => ({
      key: `s:${s}`,
      label: `Source: ${s}`,
      onRemove: () => controls.toggleSource(s),
    })),
    ...(query.added !== "any"
      ? [
          {
            key: "added",
            label: `Added: ${ADDED_LABELS[query.added].toLowerCase()}`,
            onRemove: () => controls.setAdded("any"),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      {/* Row 1: status, search, sort */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filter by status"
          className="grid w-full grid-cols-4 gap-1 rounded-lg border bg-muted/60 p-1 lg:flex lg:w-auto"
        >
          {STATUS_FILTERS.map((filter) => {
            const active = query.status === filter;
            return (
              <button
                key={filter}
                type="button"
                aria-pressed={active}
                onClick={() => controls.setStatus(filter)}
                className={cn(
                  "flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-1.5 text-sm font-medium whitespace-nowrap outline-none transition-colors sm:gap-2 sm:px-3 lg:flex-none",
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
                  {facets ? facets.status[filter] : "…"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-80 lg:flex-none">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              ref={searchRef}
              type="search"
              value={query.search}
              onChange={(e) => controls.setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && query.search) {
                  e.preventDefault();
                  controls.setSearch("");
                }
              }}
              placeholder="Search contacts"
              title="Search by name, email, phone or company"
              aria-label="Search contacts"
              aria-keyshortcuts="/"
              className="peer h-10 bg-card pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
            />
            {query.search ? (
              <button
                type="button"
                onClick={() => {
                  controls.setSearch("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-sans text-2xs leading-5 text-muted-foreground peer-focus:hidden sm:block"
              >
                /
              </kbd>
            )}
          </div>

          <SortMenu controls={controls} />
        </div>
      </div>

      {/* Row 2: attribute filters, active chips, result count */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
          <FacetFilter
            label="Practice area"
            shortLabel="Area"
            icon={Scale}
            options={facets?.matters ?? []}
            selected={query.matters}
            onToggle={controls.toggleMatter}
            onClear={controls.clearMatters}
          />
          <FacetFilter
            label="Source"
            shortLabel="Source"
            icon={Megaphone}
            options={facets?.sources ?? []}
            selected={query.sources}
            onToggle={controls.toggleSource}
            onClear={controls.clearSources}
          />
          <AddedFilter value={query.added} onChange={controls.setAdded} />
        </div>

        {chips.length > 0 ? <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden /> : null}

        <ul className="contents" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.key}>
              <span className="inline-flex h-8 max-w-64 items-center gap-1 rounded-full border border-bronze-200 bg-bronze-50 pr-1 pl-3 text-xs font-medium text-bronze-800">
                <span className="truncate">{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Remove filter ${chip.label}`}
                  className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none hover:bg-bronze-100 focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>

        {filtered ? (
          <Button variant="ghost" size="sm" onClick={controls.reset} className="h-8 text-foreground">
            Clear all
          </Button>
        ) : null}

        {facets ? (
          <p className="ml-auto text-xs text-muted-foreground tabular-nums" role="status" aria-live="polite">
            {filtered ? (
              <>
                Showing <span className="font-semibold text-foreground">{resultCount}</span> of{" "}
                {pluralize(total, "contact")}
              </>
            ) : (
              pluralize(total, "contact")
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FilterTrigger({
  label,
  shortLabel,
  icon: Icon,
  active,
  summary,
  ...props
}: React.ComponentProps<"button"> & {
  label: string;
  /** Used on phones, where three filters share one row. */
  shortLabel: string;
  icon: LucideIcon;
  active: boolean;
  summary?: string;
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap outline-none transition-colors sm:px-3",
        "focus-visible:ring-[3px] focus-visible:ring-ring/35 data-[state=open]:bg-muted",
        active
          ? "border-brand-ink bg-brand-ink text-white hover:bg-ink-800 data-[state=open]:bg-ink-800"
          : "border-input bg-card text-foreground shadow-xs hover:border-border-strong hover:bg-muted",
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate sm:hidden">{shortLabel}</span>
      <span className="hidden truncate sm:inline">{label}</span>
      {summary ? (
        <span className="rounded-full bg-brand-gold px-1.5 text-2xs leading-4 font-semibold text-brand-ink tabular-nums">
          {summary}
        </span>
      ) : null}
      <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
    </button>
  );
}

function FacetFilter({
  label,
  shortLabel,
  icon,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterTrigger
          label={label}
          shortLabel={shortLabel}
          icon={icon}
          active={selected.length > 0}
          summary={selected.length > 0 ? String(selected.length) : undefined}
          aria-label={selected.length > 0 ? `${label} filter, ${selected.length} selected` : `${label} filter`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Filter by {label.toLowerCase()}</DropdownMenuLabel>
        {options.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">No options</p>
        ) : (
          options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={() => onToggle(option.value)}
              // Keep the menu open so several options can be picked.
              onSelect={(e) => e.preventDefault()}
              className={cn(option.count === 0 && !selected.includes(option.value) && "text-muted-foreground")}
            >
              <span className="flex-1 truncate">{option.value}</span>
              <span className="ml-3 text-xs text-muted-foreground tabular-nums">{option.count}</span>
            </DropdownMenuCheckboxItem>
          ))
        )}
        {selected.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onClear} className="justify-center text-xs font-medium">
              Clear {label.toLowerCase()}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddedFilter({ value, onChange }: { value: AddedWindow; onChange: (value: AddedWindow) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterTrigger
          label={value === "any" ? "Date added" : ADDED_LABELS[value]}
          shortLabel={value === "any" ? "Added" : ADDED_LABELS[value].replace("Last ", "")}
          icon={CalendarDays}
          active={value !== "any"}
          aria-label={`Date added filter: ${ADDED_LABELS[value]}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Date added</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as AddedWindow)}>
          {ADDED_WINDOWS.map((w) => (
            <DropdownMenuRadioItem key={w} value={w}>
              {ADDED_LABELS[w]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortMenu({ controls }: { controls: ContactQueryControls }) {
  const { query, setSort } = controls;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 shrink-0"
          aria-label={`Sort by ${SORT_LABELS[query.sort]}, ${query.direction === "asc" ? "ascending" : "descending"}`}
        >
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
  );
}

function directionLabel(sort: (typeof SORT_KEYS)[number], direction: SortDirection) {
  if (sort === "name") return direction === "asc" ? "A → Z" : "Z → A";
  if (sort === "status") return direction === "asc" ? "Lead → Closed" : "Closed → Lead";
  return direction === "asc" ? "Oldest first" : "Newest first";
}
