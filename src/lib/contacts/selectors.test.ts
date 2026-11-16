import { describe, expect, it } from "vitest";
import type { Contact } from "@/types/contact";
import { DEFAULT_QUERY, getStatusCounts, matchesSearch, queryContacts } from "./selectors";
import { contactFormSchema } from "@/schemas/contact";

const make = (overrides: Partial<Contact>): Contact => ({
  id: overrides.id ?? Math.random().toString(),
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.ae",
  phone: "+971 50 123 4567",
  status: "lead",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const contacts = [
  make({ id: "a", firstName: "Zara", status: "active", company: "Falcon Crest", createdAt: "2026-01-03T00:00:00.000Z" }),
  make({ id: "b", firstName: "Adam", status: "lead", email: "adam@sandstone.ae", createdAt: "2026-01-01T00:00:00.000Z" }),
  make({ id: "c", firstName: "Mona", status: "closed", phone: "+971 4 335 9012", createdAt: "2026-01-02T00:00:00.000Z" }),
];

describe("search", () => {
  it("matches name, email, company and phone", () => {
    expect(matchesSearch(contacts[0], "zara doe")).toBe(true);
    expect(matchesSearch(contacts[1], "SANDSTONE")).toBe(true);
    expect(matchesSearch(contacts[0], "falcon")).toBe(true);
    expect(matchesSearch(contacts[2], "3359012")).toBe(true);
    expect(matchesSearch(contacts[2], "xyz")).toBe(false);
  });
});

describe("queryContacts", () => {
  it("filters by status", () => {
    expect(queryContacts(contacts, { ...DEFAULT_QUERY, status: "closed" }).map((c) => c.id)).toEqual(["c"]);
  });

  it("sorts by name ascending and date added descending", () => {
    expect(queryContacts(contacts, { ...DEFAULT_QUERY, sort: "name", direction: "asc" }).map((c) => c.id)).toEqual(["b", "c", "a"]);
    expect(queryContacts(contacts, { ...DEFAULT_QUERY, sort: "createdAt", direction: "desc" }).map((c) => c.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts by pipeline order for status", () => {
    expect(queryContacts(contacts, { ...DEFAULT_QUERY, sort: "status", direction: "asc" }).map((c) => c.status)).toEqual(["lead", "active", "closed"]);
  });

  it("counts statuses", () => {
    expect(getStatusCounts(contacts)).toEqual({ all: 3, lead: 1, active: 1, closed: 1 });
  });
});

describe("contact form schema", () => {
  const valid = {
    firstName: "  Jane ",
    lastName: "Doe",
    email: " jane@example.ae ",
    phone: "+971 50 123 4567",
    status: "lead",
    company: "",
    matterType: "",
    source: "",
    additionalInformation: "",
  };

  it("trims whitespace", () => {
    const result = contactFormSchema.parse(valid);
    expect(result.firstName).toBe("Jane");
    expect(result.email).toBe("jane@example.ae");
  });

  it("rejects missing names, bad email, bad phone and bad status", () => {
    const result = contactFormSchema.safeParse({ ...valid, firstName: "   ", email: "nope", phone: "12ab", status: "archived" });
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["firstName", "email", "phone", "status"]));
  });

  it("rejects phones with too few digits", () => {
    expect(contactFormSchema.safeParse({ ...valid, phone: "12-34" }).success).toBe(false);
  });
});
