export const CONTACT_STATUSES = ["lead", "active", "closed"] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  status: ContactStatus;
  matterType?: string;
  source?: string;
  additionalInformation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  contactId: string;
  content: string;
  createdAt: string;
  author: string;
}

/** Fields a user can edit directly. Timestamps and id are system-managed. */
export type ContactInput = Omit<Contact, "id" | "createdAt" | "updatedAt">;
