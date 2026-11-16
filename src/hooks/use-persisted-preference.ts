"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Tiny per-browser UI preference (e.g. sidebar collapsed). Separate from CRM
 * data on purpose; failures to read/write are ignored.
 */
export function usePersistedBoolean(key: string, fallback: boolean) {
  const value = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => {
      const raw = read(key);
      return raw === null ? fallback : raw === "true";
    },
    () => fallback,
  );

  const setValue = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        // Preference simply won't persist.
      }
      listeners.forEach((l) => l());
    },
    [key],
  );

  return [value, setValue] as const;
}
