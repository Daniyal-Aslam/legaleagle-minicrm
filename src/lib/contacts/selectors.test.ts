import { describe, expect, it } from "vitest";
import type { Contact } from "@/types/contact";
import { DEFAULT_QUERY, UNSPECIFIED, countActiveFilters, getContactFacets, getStatusCounts, matchesSearch, queryContacts } from "./selectors";
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

describe("attribute filters", () => {
  const now = new Date("2026-03-01T00:00:00.000Z");
  const pool = [
    make({ id: "re1", status: "lead", matterType: "Real Estate", source: "Website", createdAt: "2026-02-27T00:00:00.000Z" }),
    make({ id: "re2", status: "active", matterType: "Real Estate", source: "Referral", createdAt: "2026-01-10T00:00:00.000Z" }),
    make({ id: "fam", status: "lead", matterType: "Family", source: "Website", createdAt: "2026-02-20T00:00:00.000Z" }),
    make({ id: "none", status: "closed", createdAt: "2025-10-01T00:00:00.000Z" }),
  ];
  const ids = (q: Partial<typeof DEFAULT_QUERY>) => queryContacts(pool, { ...DEFAULT_QUERY, sort: "name", ...q }, now).map((c) => c.id).sort();

  it("filters by any of the selected practice areas", () => {
    expect(ids({ matters: ["Real Estate"] })).toEqual(["re1", "re2"]);
    expect(ids({ matters: ["Real Estate", "Family"] })).toEqual(["fam", "re1", "re2"]);
    expect(ids({ matters: [UNSPECIFIED] })).toEqual(["none"]);
  });

  it("combines source, status and date added", () => {
    expect(ids({ sources: ["Website"] })).toEqual(["fam", "re1"]);
    expect(ids({ sources: ["Website"], status: "lead", added: "7d" })).toEqual(["re1"]);
    expect(ids({ added: "30d" })).toEqual(["fam", "re1"]);
    expect(ids({ added: "90d" })).toEqual(["fam", "re1", "re2"]);
  });

  it("counts each facet against the other active filters", () => {
    const facets = getContactFacets(pool, { ...DEFAULT_QUERY, sources: ["Website"] }, { matters: ["Real Estate", "Family", "Employment"], sources: ["Website", "Referral"] }, now);
    expect(facets.status).toEqual({ all: 2, lead: 2, active: 0, closed: 0 });
    expect(facets.matters).toEqual([
      { value: "Real Estate", count: 1 },
      { value: "Family", count: 1 },
      { value: "Employment", count: 0 },
    ]);
    // The source facet ignores its own selection so other sources stay pickable.
    expect(facets.sources).toEqual([
      { value: "Website", count: 2 },
      { value: "Referral", count: 1 },
      { value: UNSPECIFIED, count: 1 },
    ]);
  });

  it("counts active filters", () => {
    expect(countActiveFilters(DEFAULT_QUERY)).toBe(0);
    expect(countActiveFilters({ ...DEFAULT_QUERY, status: "lead", matters: ["A", "B"], added: "7d" })).toBe(4);
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
