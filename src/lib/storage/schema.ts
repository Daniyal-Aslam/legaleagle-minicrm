import { z } from "zod";
import { CONTACT_STATUSES } from "@/types/contact";
import { ACTIVITY_TYPES } from "@/types/activity";
import type { Contact, Note } from "@/types/contact";
import type { Activity } from "@/types/activity";

export const STORAGE_VERSION = 1;

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");

export const storedContactSchema = z.object({
  id: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string().optional(),
  status: z.enum(CONTACT_STATUSES),
  matterType: z.string().optional(),
  source: z.string().optional(),
  additionalInformation: z.string().optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
}) satisfies z.ZodType<Contact>;

export const storedNoteSchema = z.object({
  id: z.string().min(1),
  contactId: z.string().min(1),
  content: z.string(),
  createdAt: isoDate,
  author: z.string(),
}) satisfies z.ZodType<Note>;

export const storedActivitySchema = z.object({
  id: z.string().min(1),
  contactId: z.string().min(1),
  type: z.enum(ACTIVITY_TYPES),
  description: z.string(),
  createdAt: isoDate,
  author: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}) satisfies z.ZodType<Activity>;

export interface CrmData {
  contacts: Contact[];
  notes: Note[];
  activities: Activity[];
}

export interface PersistedState extends CrmData {
  version: number;
}
