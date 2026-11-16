import type { StorageAdapter } from "./adapter";
import { parsePersistedState } from "./parse";
import { STORAGE_VERSION, type CrmData, type PersistedState } from "./schema";

export const STORAGE_KEY = "legal-eagle-crm:v1";

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    const probe = `${STORAGE_KEY}:probe`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function createLocalStorageAdapter(key = STORAGE_KEY): StorageAdapter {
  return {
    load() {
      const storage = getStorage();
      if (!storage) return { kind: "unavailable" };
      return parsePersistedState(storage.getItem(key));
    },
    save(data: CrmData) {
      const storage = getStorage();
      if (!storage) throw new Error("Storage unavailable");
      const payload: PersistedState = { version: STORAGE_VERSION, ...data };
      storage.setItem(key, JSON.stringify(payload));
    },
    clear() {
      getStorage()?.removeItem(key);
    },
    subscribe(onExternalChange) {
      const handler = (event: StorageEvent) => {
        if (event.key === key) onExternalChange();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
  };
}
