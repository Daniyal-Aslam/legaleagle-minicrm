import type { ContactStatus } from "./contact";

export const ACTIVITY_TYPES = [
  "contact_created",
  "contact_updated",
  "status_changed",
  "note_added",
  "follow_up",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const FOLLOW_UP_CHANNELS = ["call", "email", "meeting", "whatsapp"] as const;
export type FollowUpChannel = (typeof FOLLOW_UP_CHANNELS)[number];

/** Strongly-typed metadata per activity type. Stored as a plain record. */
export interface ActivityMetadataMap {
  contact_created: { status: ContactStatus };
  contact_updated: { fields: string[] };
  status_changed: { from: ContactStatus; to: ContactStatus };
  note_added: { noteId: string; excerpt: string };
  follow_up: { channel: FollowUpChannel; summary: string };
}

export interface Activity<T extends ActivityType = ActivityType> {
  id: string;
  contactId: string;
  type: T;
  description: string;
  createdAt: string;
  author?: string;
  metadata?: Record<string, unknown>;
}
