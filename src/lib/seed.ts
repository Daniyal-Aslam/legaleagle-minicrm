import type { Activity, FollowUpChannel } from "@/types/activity";
import type { Contact, ContactStatus, Note } from "@/types/contact";
import type { CrmData } from "@/lib/storage/schema";
import { buildActivity, excerpt } from "@/lib/activity/factory";
import { CURRENT_USER } from "@/lib/constants";

/**
 * Fictional demo dataset. Every person, company, phone number and email is
 * invented. Timestamps are generated relative to "now" so the demo always
 * looks current. Each seeded activity is derived from a seeded event
 * (creation, status move, note or follow-up) — there are no orphan entries.
 */

const TEAM = {
  mariam: CURRENT_USER.name,
  yousef: "Yousef Khalil",
  hana: "Hana Qureshi",
} as const;

type SeedEvent =
  | { at: number; kind: "status"; to: ContactStatus; by?: string }
  | { at: number; kind: "note"; text: string; by?: string }
  | { at: number; kind: "follow_up"; channel: FollowUpChannel; summary: string; by?: string };

interface SeedContact {
  key: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  matterType?: string;
  source?: string;
  additionalInformation?: string;
  /** Days before now the record was created (fractions = hours). */
  createdDaysAgo: number;
  createdBy?: string;
  events: SeedEvent[];
}

const SEED: SeedContact[] = [
  {
    key: "c01",
    firstName: "Omar",
    lastName: "Haddad",
    email: "omar.haddad@sandstonelogistics.ae",
    phone: "+971 50 214 7781",
    company: "Sandstone Logistics LLC",
    matterType: "Corporate & Commercial",
    source: "Referral",
    additionalInformation:
      "Referred by an existing client. Prefers morning calls; English and Arabic.",
    createdDaysAgo: 41.3,
    createdBy: TEAM.yousef,
    events: [
      { at: 39.1, kind: "follow_up", channel: "call", summary: "Intro call — outlined the review process and fee structure.", by: TEAM.yousef },
      { at: 38.9, kind: "status", to: "active", by: TEAM.yousef },
      { at: 12.4, kind: "note", text: "Engagement letter countersigned. Documents shared through the client portal; awaiting the second batch.", by: TEAM.hana },
      { at: 2.2, kind: "follow_up", channel: "email", summary: "Sent a reminder about the outstanding shareholder documents." },
    ],
  },
  {
    key: "c02",
    firstName: "Layla",
    lastName: "Rahman",
    email: "layla.rahman@brightpathclinics.ae",
    phone: "+971 55 803 1192",
    company: "Brightpath Clinics",
    matterType: "Employment",
    source: "Website",
    additionalInformation: "Submitted the website enquiry form outside office hours.",
    createdDaysAgo: 0.6,
    events: [],
  },
  {
    key: "c03",
    firstName: "Daniel",
    lastName: "Mercer",
    email: "d.mercer@harbourviewcapital.com",
    phone: "+971 52 660 4093",
    company: "Harbourview Capital",
    matterType: "Real Estate",
    source: "LinkedIn",
    createdDaysAgo: 6.2,
    events: [
      { at: 5.8, kind: "follow_up", channel: "call", summary: "Discovery call booked; asked for a summary of the property portfolio." },
      { at: 5.7, kind: "note", text: "Wants a consultation covering off-plan purchase terms for two units. Asked whether a meeting can be held in Dubai Marina." },
    ],
  },
  {
    key: "c04",
    firstName: "Fatima",
    lastName: "Al Suwaidi",
    email: "fatima.alsuwaidi@gmail.example",
    phone: "+971 56 118 2290",
    matterType: "Family",
    source: "Phone enquiry",
    additionalInformation: "Requested that all correspondence go to email only.",
    createdDaysAgo: 27.5,
    createdBy: TEAM.hana,
    events: [
      { at: 26.9, kind: "status", to: "active", by: TEAM.hana },
      { at: 9.3, kind: "follow_up", channel: "meeting", summary: "In-person consultation held at the Abu Dhabi office.", by: TEAM.hana },
      { at: 9.2, kind: "note", text: "Client confirmed preferred communication by email. Next review scheduled for the end of the month.", by: TEAM.hana },
    ],
  },
  {
    key: "c05",
    firstName: "Rajesh",
    lastName: "Menon",
    email: "rajesh@menontextiles.ae",
    phone: "+971 4 335 9012",
    company: "Menon Textiles Trading",
    matterType: "Debt Recovery",
    source: "Walk-in",
    createdDaysAgo: 63.1,
    createdBy: TEAM.yousef,
    events: [
      { at: 61.8, kind: "status", to: "active", by: TEAM.yousef },
      { at: 34.4, kind: "note", text: "Client provided supporting invoices. Handed over to the recovery team for assessment.", by: TEAM.yousef },
      { at: 8.6, kind: "status", to: "closed", by: TEAM.yousef },
      { at: 8.5, kind: "note", text: "Matter concluded. Client thanked the team and asked to be contacted for future work.", by: TEAM.yousef },
    ],
  },
  {
    key: "c06",
    firstName: "Sophie",
    lastName: "Laurent",
    email: "sophie.laurent@atelierlumiere.fr",
    phone: "+33 6 12 48 90 37",
    company: "Atelier Lumière",
    matterType: "Intellectual Property",
    source: "Event",
    additionalInformation: "Met at a design-industry networking evening. Based in Paris; available after 2pm GST.",
    createdDaysAgo: 3.4,
    events: [
      { at: 3.1, kind: "follow_up", channel: "email", summary: "Shared the intake questionnaire and available consultation slots." },
    ],
  },
  {
    key: "c07",
    firstName: "Khalid",
    lastName: "Nasser",
    email: "k.nasser@falconcrestdev.ae",
    phone: "+971 50 977 3384",
    company: "Falcon Crest Developments",
    matterType: "Real Estate",
    source: "Referral",
    createdDaysAgo: 19.7,
    events: [
      { at: 18.2, kind: "status", to: "active" },
      { at: 4.3, kind: "follow_up", channel: "whatsapp", summary: "Confirmed site-visit date with the client's project manager." },
      { at: 0.15, kind: "note", text: "Client asked for an updated timeline before the board meeting next week. Draft by Thursday." },
    ],
  },
  {
    key: "c08",
    firstName: "Aisha",
    lastName: "Karimi",
    email: "aisha.karimi@outlook.example",
    phone: "+971 58 402 6617",
    matterType: "Wills & Inheritance",
    source: "Website",
    createdDaysAgo: 11.2,
    events: [],
  },
  {
    key: "c09",
    firstName: "Thomas",
    lastName: "Whitfield",
    email: "t.whitfield@northgateengineering.com",
    phone: "+971 54 228 0145",
    company: "Northgate Engineering",
    matterType: "Employment",
    source: "LinkedIn",
    createdDaysAgo: 88.6,
    createdBy: TEAM.hana,
    events: [
      { at: 86.1, kind: "status", to: "active", by: TEAM.hana },
      { at: 47.3, kind: "status", to: "closed", by: TEAM.hana },
      { at: 47.2, kind: "note", text: "Client chose to proceed with in-house counsel. Closed on good terms.", by: TEAM.hana },
    ],
  },
  {
    key: "c10",
    firstName: "Noura",
    lastName: "Al Mazrouei",
    email: "noura@qamarhospitality.ae",
    phone: "+971 2 641 7730",
    company: "Qamar Hospitality Group",
    matterType: "Corporate & Commercial",
    source: "Event",
    createdDaysAgo: 14.9,
    events: [
      { at: 13.6, kind: "follow_up", channel: "meeting", summary: "Introductory meeting with the group's operations director." },
      { at: 13.5, kind: "status", to: "active" },
      { at: 1.4, kind: "note", text: "Requested a call with the partner in charge before signing off the scope." },
    ],
  },
  {
    key: "c11",
    firstName: "Victor",
    lastName: "Okafor",
    email: "victor.okafor@meridianfreight.com",
    phone: "+971 52 351 9908",
    company: "Meridian Freight",
    matterType: "Civil Litigation",
    source: "Phone enquiry",
    createdDaysAgo: 8.1,
    events: [
      { at: 7.9, kind: "note", text: "Initial enquiry by phone. Asked for a conflict check before sharing details." },
      { at: 7.4, kind: "follow_up", channel: "email", summary: "Requested company registration details for the conflict check." },
    ],
  },
  {
    key: "c12",
    firstName: "Mei",
    lastName: "Tanaka",
    email: "mei.tanaka@sakurastudio.jp",
    phone: "+971 55 774 2051",
    company: "Sakura Design Studio",
    matterType: "Intellectual Property",
    source: "Referral",
    createdDaysAgo: 52.4,
    events: [
      { at: 50.2, kind: "status", to: "active" },
      { at: 22.6, kind: "status", to: "closed" },
    ],
  },
  {
    key: "c13",
    firstName: "Hassan",
    lastName: "Farouk",
    email: "hassan.farouk@greenoasisfarms.ae",
    phone: "+971 50 663 1409",
    company: "Green Oasis Farms",
    matterType: "Debt Recovery",
    source: "Website",
    createdDaysAgo: 1.8,
    events: [
      { at: 1.6, kind: "follow_up", channel: "call", summary: "Left a voicemail; will try again tomorrow morning." },
    ],
  },
];

export function createSeedData(now: Date = new Date()): CrmData {
  const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000).toISOString();

  const contacts: Contact[] = [];
  const notes: Note[] = [];
  const activities: Activity[] = [];

  for (const seed of SEED) {
    const id = `ct_${seed.key}`;
    const events = [...seed.events].sort((a, b) => b.at - a.at);
    let status: ContactStatus = "lead";
    let updatedAt = iso(seed.createdDaysAgo);

    activities.push(
      buildActivity({
        contactId: id,
        type: "contact_created",
        metadata: { status: "lead" },
        createdAt: iso(seed.createdDaysAgo),
        author: seed.createdBy ?? TEAM.mariam,
      }),
    );

    for (const event of events) {
      const createdAt = iso(event.at);
      updatedAt = createdAt; // events are oldest → newest
      const author = event.by ?? TEAM.mariam;
      if (event.kind === "status") {
        activities.push(
          buildActivity({
            contactId: id,
            type: "status_changed",
            metadata: { from: status, to: event.to },
            createdAt,
            author,
          }),
        );
        status = event.to;
      } else if (event.kind === "note") {
        const noteId = `nt_${seed.key}_${notes.length}`;
        notes.push({ id: noteId, contactId: id, content: event.text, createdAt, author });
        activities.push(
          buildActivity({
            contactId: id,
            type: "note_added",
            metadata: { noteId, excerpt: excerpt(event.text) },
            createdAt,
            author,
          }),
        );
      } else {
        activities.push(
          buildActivity({
            contactId: id,
            type: "follow_up",
            metadata: { channel: event.channel, summary: event.summary },
            createdAt,
            author,
          }),
        );
      }
    }

    contacts.push({
      id,
      firstName: seed.firstName,
      lastName: seed.lastName,
      email: seed.email,
      phone: seed.phone,
      company: seed.company,
      status,
      matterType: seed.matterType,
      source: seed.source,
      additionalInformation: seed.additionalInformation,
      createdAt: iso(seed.createdDaysAgo),
      updatedAt,
    });
  }

  return { contacts, notes, activities };
}
