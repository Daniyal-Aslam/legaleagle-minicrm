import type { Contact } from "@/types/contact";
import { getInitials } from "@/lib/contacts/selectors";
import { cn } from "@/lib/utils";

/** Restrained, brand-derived avatar tints. Assigned deterministically by id. */
const TINTS = [
  "bg-bronze-100 text-bronze-800",
  "bg-status-active-bg text-status-active-fg",
  "bg-status-closed-bg text-status-closed-fg",
  "bg-status-lead-bg text-status-lead-fg",
] as const;

function tintFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

const SIZES = {
  sm: "size-7 text-2xs",
  md: "size-9 text-xs",
  lg: "size-14 text-lg",
} as const;

interface Props {
  contact: Pick<Contact, "id" | "firstName" | "lastName">;
  size?: keyof typeof SIZES;
  className?: string;
}

export function ContactAvatar({ contact, size = "md", className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-heading font-semibold tracking-wide select-none",
        SIZES[size],
        tintFor(contact.id),
        className,
      )}
    >
      {getInitials(contact)}
    </span>
  );
}
