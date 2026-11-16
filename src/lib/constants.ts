import type { ContactStatus } from "@/types/contact";
import type { FollowUpChannel } from "@/types/activity";

/** Fictional signed-in intake coordinator used as note/activity author. */
export const CURRENT_USER = {
  name: "Mariam Al Hashimi",
  role: "Intake Coordinator",
  initials: "MA",
} as const;

export const STATUS_META: Record<
  ContactStatus,
  { label: string; description: string }
> = {
  lead: { label: "Lead", description: "New enquiry awaiting qualification" },
  active: { label: "Active", description: "Engaged client with an open matter" },
  closed: { label: "Closed", description: "Engagement concluded or declined" },
};

/** General practice areas used for intake routing — not legal cases. */
export const MATTER_TYPES = [
  "Corporate & Commercial",
  "Real Estate",
  "Employment",
  "Family",
  "Civil Litigation",
  "Debt Recovery",
  "Wills & Inheritance",
  "Intellectual Property",
] as const;

export const CONTACT_SOURCES = [
  "Website",
  "Referral",
  "Phone enquiry",
  "Walk-in",
  "LinkedIn",
  "Event",
] as const;

export const FOLLOW_UP_LABELS: Record<FollowUpChannel, string> = {
  call: "Phone call",
  email: "Email",
  meeting: "Meeting",
  whatsapp: "WhatsApp",
};
