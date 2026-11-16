const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatTime(iso: string) {
  return timeFormatter.format(new Date(iso));
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

export function formatRelative(iso: string, now: Date = new Date()) {
  const seconds = (new Date(iso).getTime() - now.getTime()) / 1000;
  if (Math.abs(seconds) < 45) return "just now";
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size || unit === "minute") {
      return relativeFormatter.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

/** Groups timeline entries: "Today", "Yesterday", or a date. */
export function formatDayHeading(iso: string, now: Date = new Date()) {
  const date = new Date(iso);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(date)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return dateFormatter.format(date);
}
