"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Mail, MessageCircle, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { FOLLOW_UP_CHANNELS, type FollowUpChannel } from "@/types/activity";
import type { Contact } from "@/types/contact";
import { FOLLOW_UP_LABELS } from "@/lib/constants";
import { getFullName } from "@/lib/contacts/selectors";
import { cn } from "@/lib/utils";
import { crm } from "@/store";

export const CHANNEL_ICONS: Record<FollowUpChannel, typeof Mail> = {
  call: PhoneCall,
  email: Mail,
  meeting: CalendarClock,
  whatsapp: MessageCircle,
};

interface Props {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FollowUpDialog({ contact, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a follow-up</DialogTitle>
          <DialogDescription>Record an interaction with {getFullName(contact)}. It appears in the activity timeline.</DialogDescription>
        </DialogHeader>
        {open ? <FollowUpForm contact={contact} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function FollowUpForm({ contact, onDone }: { contact: Contact; onDone: () => void }) {
  const [channel, setChannel] = useState<FollowUpChannel>("call");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string>();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = summary.trim();
    if (!trimmed) {
      setError("Add a short summary of the interaction");
      return;
    }
    if (trimmed.length > 500) {
      setError("Keep the summary under 500 characters");
      return;
    }
    if (crm().recordFollowUp(contact.id, channel, trimmed)) {
      toast.success("Follow-up recorded");
      onDone();
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Channel</legend>
        <div role="group" aria-label="Channel" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FOLLOW_UP_CHANNELS.map((option) => {
            const Icon = CHANNEL_ICONS[option];
            const selected = option === channel;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setChannel(option)}
                className={cn(
                  "flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border text-xs font-medium outline-none transition-colors",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/35",
                  selected
                    ? "border-brand-bronze bg-bronze-50 text-bronze-800"
                    : "text-muted-foreground hover:border-border-strong hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {FOLLOW_UP_LABELS[option]}
              </button>
            );
          })}
        </div>
      </fieldset>
      <FormField id="follow-up-summary" label="Summary" required error={error}>
        {(p) => (
          <Textarea
            {...p}
            autoFocus
            rows={3}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              if (error) setError(undefined);
            }}
            placeholder="e.g. Confirmed consultation for Tuesday at 10am."
          />
        )}
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Record follow-up</Button>
      </DialogFooter>
    </form>
  );
}
