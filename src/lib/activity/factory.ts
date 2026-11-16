import type { Activity, ActivityMetadataMap, ActivityType } from "@/types/activity";
import type { Contact, ContactInput } from "@/types/contact";
import { FOLLOW_UP_LABELS, STATUS_META } from "@/lib/constants";
import { createId } from "@/lib/utils";

interface BuildArgs<T extends ActivityType> {
  contactId: string;
  type: T;
  metadata: ActivityMetadataMap[T];
  createdAt: string;
  author: string;
}

export const FIELD_LABELS: Record<keyof ContactInput, string> = {
  firstName: "first name",
  lastName: "last name",
  email: "email",
  phone: "phone",
  company: "company",
  status: "status",
  matterType: "matter type",
  source: "source",
  additionalInformation: "additional information",
};

function formatFieldList(fields: string[]) {
  if (fields.length <= 2) return fields.join(" and ");
  return `${fields.slice(0, -1).join(", ")} and ${fields[fields.length - 1]}`;
}

function describe(type: ActivityType, metadata: ActivityMetadataMap[ActivityType]): string {
  switch (type) {
    case "contact_created":
      return "Contact created";
    case "contact_updated": {
      const { fields } = metadata as ActivityMetadataMap["contact_updated"];
      return fields.length ? `Updated ${formatFieldList(fields)}` : "Contact details updated";
    }
    case "status_changed": {
      const { from, to } = metadata as ActivityMetadataMap["status_changed"];
      return `Moved from ${STATUS_META[from].label} to ${STATUS_META[to].label}`;
    }
    case "note_added":
      return "Note added";
    case "follow_up": {
      const { channel } = metadata as ActivityMetadataMap["follow_up"];
      return `${FOLLOW_UP_LABELS[channel]} follow-up recorded`;
    }
  }
}

export function buildActivity<T extends ActivityType>({
  contactId,
  type,
  metadata,
  createdAt,
  author,
}: BuildArgs<T>): Activity<T> {
  return {
    id: createId("act"),
    contactId,
    type,
    description: describe(type, metadata),
    createdAt,
    author,
    metadata: { ...metadata },
  };
}

/** Narrow an activity's metadata to its typed shape. */
export function getMetadata<T extends ActivityType>(
  activity: Activity,
  type: T,
): ActivityMetadataMap[T] | undefined {
  return activity.type === type
    ? (activity.metadata as ActivityMetadataMap[T] | undefined)
    : undefined;
}

/** Lists changed editable fields, excluding status (tracked separately). */
export function diffContact(before: Contact, after: ContactInput): (keyof ContactInput)[] {
  const keys = Object.keys(FIELD_LABELS) as (keyof ContactInput)[];
  return keys.filter((key) => key !== "status" && (before[key] ?? "") !== (after[key] ?? ""));
}

export function excerpt(content: string, length = 140) {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length - 1).trimEnd()}…` : clean;
}
