import { createStore } from "zustand/vanilla";
import type { Activity, FollowUpChannel } from "@/types/activity";
import type { Contact, ContactInput, ContactStatus, Note } from "@/types/contact";
import type { StorageAdapter } from "@/lib/storage/adapter";
import type { CrmData } from "@/lib/storage/schema";
import { buildActivity, diffContact, excerpt, FIELD_LABELS } from "@/lib/activity/factory";
import { CURRENT_USER } from "@/lib/constants";
import { createSeedData } from "@/lib/seed";
import { createId } from "@/lib/utils";

export type HydrationStatus = "loading" | "ready";
/** ok: saved to the browser · unavailable: storage blocked · failed: last write threw */
export type PersistenceStatus = "ok" | "unavailable" | "failed";

export type RecoveryNotice = "restored-from-corrupt" | "dropped-invalid-records" | null;

export interface CrmState extends CrmData {
  hydration: HydrationStatus;
  persistence: PersistenceStatus;
  recoveryNotice: RecoveryNotice;
}

export interface CrmActions {
  hydrate(): void;
  createContact(input: ContactInput): Contact;
  /** Returns false when the contact does not exist. */
  updateContact(id: string, input: ContactInput): boolean;
  deleteContact(id: string): void;
  changeStatus(id: string, status: ContactStatus): boolean;
  addNote(contactId: string, content: string): Note | null;
  recordFollowUp(contactId: string, channel: FollowUpChannel, summary: string): boolean;
  resetDemoData(): void;
  dismissRecoveryNotice(): void;
}

export type CrmStore = CrmState & CrmActions;

interface Options {
  adapter: StorageAdapter;
  now?: () => Date;
  author?: string;
}

export function createCrmStore({ adapter, now = () => new Date(), author = CURRENT_USER.name }: Options) {
  const timestamp = () => now().toISOString();

  return createStore<CrmStore>()((set, get) => {
    /** Writes the current dataset through the adapter; never throws to the UI. */
    const persist = () => {
      if (get().persistence === "unavailable") return;
      const { contacts, notes, activities } = get();
      try {
        adapter.save({ contacts, notes, activities });
        if (get().persistence !== "ok") set({ persistence: "ok" });
      } catch {
        set({ persistence: "failed" });
      }
    };

    const commit = (partial: Partial<CrmData>) => {
      set(partial);
      persist();
    };

    const findContact = (id: string) => get().contacts.find((c) => c.id === id);

    return {
      contacts: [],
      notes: [],
      activities: [],
      hydration: "loading",
      persistence: "ok",
      recoveryNotice: null,

      hydrate() {
        const result = adapter.load();
        switch (result.kind) {
          case "ok":
            set({
              ...result.data,
              hydration: "ready",
              persistence: "ok",
              recoveryNotice: result.droppedRecords > 0 ? "dropped-invalid-records" : null,
            });
            if (result.droppedRecords > 0) persist();
            return;
          case "empty":
            set({ ...createSeedData(now()), hydration: "ready", persistence: "ok" });
            persist();
            return;
          case "corrupt":
            set({
              ...createSeedData(now()),
              hydration: "ready",
              persistence: "ok",
              recoveryNotice: "restored-from-corrupt",
            });
            persist();
            return;
          case "unavailable":
            // Still usable for the session, but nothing will survive a refresh.
            set({ ...createSeedData(now()), hydration: "ready", persistence: "unavailable" });
            return;
        }
      },

      createContact(input) {
        const createdAt = timestamp();
        const contact: Contact = { ...input, id: createId("ct"), createdAt, updatedAt: createdAt };
        const created = buildActivity({
          contactId: contact.id,
          type: "contact_created",
          metadata: { status: contact.status },
          createdAt,
          author,
        });
        commit({
          contacts: [contact, ...get().contacts],
          activities: [created, ...get().activities],
        });
        return contact;
      },

      updateContact(id, input) {
        const existing = findContact(id);
        if (!existing) return false;

        const changedFields = diffContact(existing, input);
        const statusChanged = existing.status !== input.status;
        if (!changedFields.length && !statusChanged) return true;

        const updatedAt = timestamp();
        const newActivities: Activity[] = [];
        if (changedFields.length) {
          newActivities.push(
            buildActivity({
              contactId: id,
              type: "contact_updated",
              metadata: { fields: changedFields.map((f) => FIELD_LABELS[f]) },
              createdAt: updatedAt,
              author,
            }),
          );
        }
        if (statusChanged) {
          newActivities.push(
            buildActivity({
              contactId: id,
              type: "status_changed",
              metadata: { from: existing.status, to: input.status },
              createdAt: updatedAt,
              author,
            }),
          );
        }

        const updated: Contact = {
          ...input,
          id,
          createdAt: existing.createdAt,
          updatedAt,
        };
        commit({
          contacts: get().contacts.map((c) => (c.id === id ? updated : c)),
          activities: [...newActivities, ...get().activities],
        });
        return true;
      },

      deleteContact(id) {
        commit({
          contacts: get().contacts.filter((c) => c.id !== id),
          notes: get().notes.filter((n) => n.contactId !== id),
          activities: get().activities.filter((a) => a.contactId !== id),
        });
      },

      changeStatus(id, status) {
        const existing = findContact(id);
        if (!existing) return false;
        if (existing.status === status) return true;
        const updatedAt = timestamp();
        const activity = buildActivity({
          contactId: id,
          type: "status_changed",
          metadata: { from: existing.status, to: status },
          createdAt: updatedAt,
          author,
        });
        commit({
          contacts: get().contacts.map((c) => (c.id === id ? { ...c, status, updatedAt } : c)),
          activities: [activity, ...get().activities],
        });
        return true;
      },

      addNote(contactId, content) {
        const trimmed = content.trim();
        if (!trimmed || !findContact(contactId)) return null;
        const createdAt = timestamp();
        const note: Note = { id: createId("nt"), contactId, content: trimmed, createdAt, author };
        const activity = buildActivity({
          contactId,
          type: "note_added",
          metadata: { noteId: note.id, excerpt: excerpt(trimmed) },
          createdAt,
          author,
        });
        commit({
          contacts: touch(get().contacts, contactId, createdAt),
          notes: [note, ...get().notes],
          activities: [activity, ...get().activities],
        });
        return note;
      },

      recordFollowUp(contactId, channel, summary) {
        if (!findContact(contactId)) return false;
        const createdAt = timestamp();
        const activity = buildActivity({
          contactId,
          type: "follow_up",
          metadata: { channel, summary: summary.trim() },
          createdAt,
          author,
        });
        commit({
          contacts: touch(get().contacts, contactId, createdAt),
          activities: [activity, ...get().activities],
        });
        return true;
      },

      resetDemoData() {
        set({ ...createSeedData(now()), recoveryNotice: null });
        persist();
      },

      dismissRecoveryNotice() {
        set({ recoveryNotice: null });
      },
    };
  });
}

/**
 * Any recorded interaction (edit, status move, note, follow-up) counts as an
 * update to the relationship record, so "Last updated" reflects real activity.
 */
function touch(contacts: Contact[], id: string, updatedAt: string) {
  return contacts.map((c) => (c.id === id ? { ...c, updatedAt } : c));
}

/** Case-insensitive duplicate check used by the contact form. */
export function isEmailTaken(contacts: Contact[], email: string, excludeId?: string) {
  const normalized = email.trim().toLowerCase();
  return contacts.some((c) => c.id !== excludeId && c.email.toLowerCase() === normalized);
}
