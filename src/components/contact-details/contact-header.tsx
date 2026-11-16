"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronDown, Copy, Mail, MoreHorizontal, Pencil, Phone, PhoneCall, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { STATUS_STYLES, StatusDot } from "@/components/shared/status-badge";
import { StatusMenu } from "@/components/shared/status-menu";
import { DeleteContactDialog } from "@/components/contacts/delete-contact-dialog";
import type { Contact } from "@/types/contact";
import { STATUS_META } from "@/lib/constants";
import { getFullName } from "@/lib/contacts/selectors";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { FollowUpDialog } from "./follow-up-dialog";

export function ContactHeader({ contact }: { contact: Contact }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const subtitle = [contact.company, contact.matterType].filter(Boolean).join(" · ");

  return (
    <section aria-label="Contact summary" className="rounded-xl border bg-card shadow-xs">
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <ContactAvatar contact={contact} size="lg" />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="truncate text-2xl font-semibold">{getFullName(contact)}</h1>
              <StatusMenu contact={contact} label="Change status">
                <button
                  type="button"
                  aria-label={`Status: ${STATUS_META[contact.status].label}. Change status`}
                  className={cn(
                    "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full pr-2 pl-2.5 text-xs font-medium outline-none transition-shadow",
                    "hover:ring-2 hover:ring-current/15 focus-visible:ring-[3px] focus-visible:ring-ring/35",
                    STATUS_STYLES[contact.status].badge,
                  )}
                >
                  <StatusDot status={contact.status} />
                  {STATUS_META[contact.status].label}
                  <ChevronDown className="size-3 opacity-70" aria-hidden />
                </button>
              </StatusMenu>
            </div>
            {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <ContactChip icon={Mail} href={`mailto:${contact.email}`} value={contact.email} label="email" />
              <ContactChip icon={Phone} href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} value={contact.phone} label="phone number" />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => setFollowUpOpen(true)}>
            <PhoneCall aria-hidden />
            Log follow-up
          </Button>
          <Button onClick={() => useUiStore.getState().openEditContact(contact.id)}>
            <Pencil aria-hidden />
            Edit
          </Button>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => copy(contact.email, "Email")}>
                <Copy aria-hidden />
                Copy email
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => copy(contact.phone, "Phone number")}>
                <Copy aria-hidden />
                Copy phone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(contact)}>
                <Trash2 aria-hidden />
                Delete contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <FollowUpDialog contact={contact} open={followUpOpen} onOpenChange={setFollowUpOpen} />
      <DeleteContactDialog
        contact={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => router.replace("/contacts")}
      />
    </section>
  );
}

async function copy(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`, { icon: <Check className="size-4" /> });
  } catch {
    toast.error(`Couldn't copy the ${label.toLowerCase()}`);
  }
}

function ContactChip({
  icon: Icon,
  href,
  value,
  label,
}: {
  icon: typeof Mail;
  href: string;
  value: string;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-label={`${value} — contact by ${label}`}
      className="inline-flex h-8 max-w-full items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-sm text-foreground outline-none transition-colors hover:border-border-strong hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/35"
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate tabular-nums">{value}</span>
    </a>
  );
}
