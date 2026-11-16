import type { CrmData } from "./schema";

export type LoadResult =
  | { kind: "empty" }
  | { kind: "ok"; data: CrmData; droppedRecords: number }
  | { kind: "corrupt" }
  | { kind: "unavailable" };

/**
 * Persistence boundary. The store only talks to this interface, so the
 * LocalStorage implementation can be swapped for Supabase or a REST API
 * (made async) without touching UI components.
 */
export interface StorageAdapter {
  load(): LoadResult;
  save(data: CrmData): void;
  clear(): void;
  /** Subscribe to changes made by another tab. Returns an unsubscribe fn. */
  subscribe?(onExternalChange: () => void): () => void;
}
