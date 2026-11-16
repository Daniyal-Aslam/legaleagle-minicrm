import type { z } from "zod";
import type { LoadResult } from "./adapter";
import {
  STORAGE_VERSION,
  storedActivitySchema,
  storedContactSchema,
  storedNoteSchema,
} from "./schema";

function parseList<T>(value: unknown, schema: z.ZodType<T>) {
  if (!Array.isArray(value)) return { items: [] as T[], dropped: 0, valid: false };
  const items: T[] = [];
  let dropped = 0;
  for (const entry of value) {
    const result = schema.safeParse(entry);
    if (result.success) items.push(result.data);
    else dropped += 1;
  }
  return { items, dropped, valid: true };
}

/**
 * Parses a raw persisted string. Invalid individual records are dropped
 * (and counted) rather than discarding the whole dataset; structurally
 * broken payloads are reported as corrupt so the caller can recover.
 */
export function parsePersistedState(raw: string | null): LoadResult {
  if (raw === null) return { kind: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "corrupt" };
  }

  if (typeof parsed !== "object" || parsed === null) return { kind: "corrupt" };
  const record = parsed as Record<string, unknown>;
  if (record.version !== STORAGE_VERSION) return { kind: "corrupt" };

  const contacts = parseList(record.contacts, storedContactSchema);
  const notes = parseList(record.notes, storedNoteSchema);
  const activities = parseList(record.activities, storedActivitySchema);
  if (!contacts.valid || !notes.valid || !activities.valid) return { kind: "corrupt" };

  // Drop orphans that reference contacts which no longer exist.
  const ids = new Set(contacts.items.map((c) => c.id));
  const liveNotes = notes.items.filter((n) => ids.has(n.contactId));
  const liveActivities = activities.items.filter((a) => ids.has(a.contactId));

  return {
    kind: "ok",
    data: { contacts: contacts.items, notes: liveNotes, activities: liveActivities },
    droppedRecords: contacts.dropped + notes.dropped + activities.dropped,
  };
}
