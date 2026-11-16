import { describe, expect, it } from "vitest";
import { createMemoryAdapter } from "@/lib/storage/memory";
import { createCrmStore, isEmailTaken } from "./crm-store";
import type { ContactInput } from "@/types/contact";
import type { StorageAdapter } from "@/lib/storage/adapter";

const input: ContactInput = {
  firstName: "Test",
  lastName: "Person",
  email: "test.person@example.ae",
  phone: "+971 50 000 0000",
  status: "lead",
  company: "Example Co",
};

function setup(raw: string | null = null) {
  let clock = new Date("2026-01-10T09:00:00.000Z").getTime();
  const adapter = createMemoryAdapter(raw);
  const store = createCrmStore({
    adapter,
    now: () => new Date((clock += 60_000)),
    author: "Tester",
  });
  store.getState().hydrate();
  return { store, adapter };
}

describe("hydration", () => {
  it("seeds demo data on first load and persists it", () => {
    const { store, adapter } = setup();
    const state = store.getState();
    expect(state.hydration).toBe("ready");
    expect(state.contacts.length).toBeGreaterThanOrEqual(10);
    expect(new Set(state.contacts.map((c) => c.status))).toEqual(new Set(["lead", "active", "closed"]));
    expect(adapter.raw()).not.toBeNull();
  });

  it("every seeded activity belongs to an existing contact", () => {
    const { store } = setup();
    const ids = new Set(store.getState().contacts.map((c) => c.id));
    expect(store.getState().activities.every((a) => ids.has(a.contactId))).toBe(true);
  });

  it("restores from malformed JSON and flags a recovery notice", () => {
    const { store } = setup("{not json");
    expect(store.getState().contacts.length).toBeGreaterThan(0);
    expect(store.getState().recoveryNotice).toBe("restored-from-corrupt");
  });

  it("drops invalid records but keeps valid ones", () => {
    const { store: seeded, adapter } = setup();
    const data = JSON.parse(adapter.raw()!);
    data.contacts[0].status = "archived";
    const { store } = setup(JSON.stringify(data));
    expect(store.getState().contacts).toHaveLength(seeded.getState().contacts.length - 1);
    expect(store.getState().recoveryNotice).toBe("dropped-invalid-records");
  });

  it("keeps working in memory when storage is unavailable", () => {
    const adapter: StorageAdapter = {
      load: () => ({ kind: "unavailable" }),
      save: () => {
        throw new Error("blocked");
      },
      clear: () => {},
    };
    const store = createCrmStore({ adapter });
    store.getState().hydrate();
    expect(store.getState().persistence).toBe("unavailable");
    expect(() => store.getState().createContact(input)).not.toThrow();
  });

  it("flags a failed write without throwing", () => {
    let fail = false;
    const memory = createMemoryAdapter();
    const adapter: StorageAdapter = {
      ...memory,
      save: (d) => {
        if (fail) throw new Error("QuotaExceededError");
        memory.save(d);
      },
    };
    const store = createCrmStore({ adapter });
    store.getState().hydrate();
    fail = true;
    store.getState().createContact(input);
    expect(store.getState().persistence).toBe("failed");
  });
});

describe("contact lifecycle", () => {
  it("creates a contact with a created activity and persists it", () => {
    const { store, adapter } = setup();
    const contact = store.getState().createContact(input);
    const activity = store.getState().activities.find((a) => a.contactId === contact.id);
    expect(activity?.type).toBe("contact_created");
    expect(adapter.raw()).toContain(contact.id);

    // Survives a "refresh": a new store over the same storage.
    const reloaded = createCrmStore({ adapter });
    reloaded.getState().hydrate();
    expect(reloaded.getState().contacts.some((c) => c.id === contact.id)).toBe(true);
  });

  it("records changed fields and status separately on edit", () => {
    const { store } = setup();
    const contact = store.getState().createContact(input);
    store.getState().updateContact(contact.id, { ...input, phone: "+971 50 111 1111", status: "active" });
    const types = store
      .getState()
      .activities.filter((a) => a.contactId === contact.id)
      .map((a) => a.type);
    expect(types).toEqual(expect.arrayContaining(["contact_updated", "status_changed"]));
    const updated = store.getState().activities.find((a) => a.type === "contact_updated" && a.contactId === contact.id);
    expect(updated?.metadata).toEqual({ fields: ["phone"] });
  });

  it("does not log an activity when nothing changed", () => {
    const { store } = setup();
    const contact = store.getState().createContact(input);
    const before = store.getState().activities.length;
    store.getState().updateContact(contact.id, input);
    expect(store.getState().activities.length).toBe(before);
  });

  it("moves through the pipeline and logs each transition", () => {
    const { store } = setup();
    const contact = store.getState().createContact(input);
    store.getState().changeStatus(contact.id, "active");
    store.getState().changeStatus(contact.id, "closed");
    const moves = store
      .getState()
      .activities.filter((a) => a.contactId === contact.id && a.type === "status_changed")
      .map((a) => a.metadata);
    expect(moves).toEqual([
      { from: "active", to: "closed" },
      { from: "lead", to: "active" },
    ]);
    expect(store.getState().contacts.find((c) => c.id === contact.id)?.status).toBe("closed");
  });

  it("adds notes with author and a note activity; rejects blank notes", () => {
    const { store } = setup();
    const contact = store.getState().createContact(input);
    expect(store.getState().addNote(contact.id, "   ")).toBeNull();
    const note = store.getState().addNote(contact.id, "  Called the client.  ");
    expect(note).toMatchObject({ content: "Called the client.", author: "Tester" });
    expect(store.getState().activities[0]).toMatchObject({ type: "note_added", contactId: contact.id });
  });

  it("cascades deletes to notes and activities", () => {
    const { store } = setup();
    const contact = store.getState().createContact(input);
    store.getState().addNote(contact.id, "Hello");
    store.getState().deleteContact(contact.id);
    const s = store.getState();
    expect(s.contacts.some((c) => c.id === contact.id)).toBe(false);
    expect(s.notes.some((n) => n.contactId === contact.id)).toBe(false);
    expect(s.activities.some((a) => a.contactId === contact.id)).toBe(false);
  });

  it("resets demo data", () => {
    const { store } = setup();
    const count = store.getState().contacts.length;
    store.getState().createContact(input);
    store.getState().resetDemoData();
    expect(store.getState().contacts.length).toBe(count);
  });

  it("detects duplicate emails case-insensitively", () => {
    const { store } = setup();
    const contact = store.getState().createContact(input);
    const contacts = store.getState().contacts;
    expect(isEmailTaken(contacts, "TEST.person@example.ae")).toBe(true);
    expect(isEmailTaken(contacts, "test.person@example.ae", contact.id)).toBe(false);
  });
});
