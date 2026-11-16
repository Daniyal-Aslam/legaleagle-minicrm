import type { StorageAdapter } from "./adapter";
import { parsePersistedState } from "./parse";
import { STORAGE_VERSION, type CrmData } from "./schema";

/** In-memory adapter used by unit tests. */
export function createMemoryAdapter(initialRaw: string | null = null): StorageAdapter & {
  raw: () => string | null;
} {
  let raw = initialRaw;
  return {
    load: () => parsePersistedState(raw),
    save: (data: CrmData) => {
      raw = JSON.stringify({ version: STORAGE_VERSION, ...data });
    },
    clear: () => {
      raw = null;
    },
    raw: () => raw,
  };
}
