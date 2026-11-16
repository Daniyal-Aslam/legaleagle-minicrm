"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createLocalStorageAdapter } from "@/lib/storage/local-storage";
import { crm, crmStore } from "@/store";

const RECOVERY_MESSAGES = {
  "restored-from-corrupt": {
    title: "Saved data couldn't be read",
    description: "The sample dataset has been restored so you can keep working.",
  },
  "dropped-invalid-records": {
    title: "Some saved records were skipped",
    description: "A few records were unreadable and have been removed.",
  },
} as const;

/** Loads persisted data after mount (LocalStorage is client-only). */
export function StoreHydrator() {
  useEffect(() => {
    crm().hydrate();

    const notice = crmStore.getState().recoveryNotice;
    if (notice) {
      crm().dismissRecoveryNotice();
      // Defer one tick: the <Toaster> subscribes in its own (later) effect.
      // Not cleared on cleanup, so StrictMode double-effects still show it once.
      window.setTimeout(() =>
        toast.warning(RECOVERY_MESSAGES[notice].title, {
          description: RECOVERY_MESSAGES[notice].description,
        }),
      );
    }

    // Tell the user once when a write fails (e.g. storage quota reached).
    const unsubscribePersistence = crmStore.subscribe((state, prev) => {
      if (state.persistence === "failed" && prev.persistence !== "failed") {
        toast.error("Changes couldn't be saved", {
          description: "Your browser storage is full or blocked. Recent changes may be lost on refresh.",
        });
      }
    });

    // Keep multiple tabs in sync.
    const unsubscribeTabs = createLocalStorageAdapter().subscribe?.(() => crm().hydrate());

    return () => {
      unsubscribePersistence();
      unsubscribeTabs?.();
    };
  }, []);

  return null;
}
