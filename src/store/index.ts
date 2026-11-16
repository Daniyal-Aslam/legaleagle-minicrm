"use client";

import { useMemo } from "react";
import { useStore } from "zustand";
import { createLocalStorageAdapter } from "@/lib/storage/local-storage";
import { getLatestActivityByContact } from "@/lib/contacts/selectors";
import { createCrmStore, type CrmStore } from "./crm-store";

/** Single source of truth shared by every screen. */
export const crmStore = createCrmStore({ adapter: createLocalStorageAdapter() });

/** Mutations are stable functions; call them without subscribing. */
export const crm = () => crmStore.getState();

export function useCrm<T>(selector: (state: CrmStore) => T): T {
  return useStore(crmStore, selector);
}

export function useIsHydrated() {
  return useCrm((s) => s.hydration === "ready");
}

export function useContact(id: string) {
  return useCrm((s) => s.contacts.find((c) => c.id === id));
}

export function useContactNotes(contactId: string) {
  const notes = useCrm((s) => s.notes);
  return useMemo(
    () =>
      notes
        .filter((n) => n.contactId === contactId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notes, contactId],
  );
}

export function useContactActivities(contactId: string) {
  const activities = useCrm((s) => s.activities);
  return useMemo(
    () =>
      activities
        .filter((a) => a.contactId === contactId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activities, contactId],
  );
}

export function useLatestActivityMap() {
  const activities = useCrm((s) => s.activities);
  return useMemo(() => getLatestActivityByContact(activities), [activities]);
}
