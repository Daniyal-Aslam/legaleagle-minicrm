"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { StatusDot } from "@/components/shared/status-badge";
import {
  contactFormSchema,
  type ContactFormOutput,
  type ContactFormValues,
} from "@/schemas/contact";
import { CONTACT_STATUSES, type Contact } from "@/types/contact";
import { CONTACT_SOURCES, MATTER_TYPES, STATUS_META } from "@/lib/constants";
import { EMPTY_CONTACT_FORM, toContactInput, toFormValues } from "@/lib/contacts/mapper";
import { getFullName } from "@/lib/contacts/selectors";
import { crm, useCrm } from "@/store";
import { isEmailTaken } from "@/store/crm-store";
import { useUiStore } from "@/store/ui-store";

const NONE = "__none";

/** Single dialog instance for both creating and editing contacts. */
export function ContactFormDialog() {
  const formState = useUiStore((s) => s.contactForm);
  const close = useUiStore((s) => s.closeContactForm);
  const contactId = formState.open && formState.mode === "edit" ? formState.contactId : undefined;
  const contact = useCrm((s) => (contactId ? s.contacts.find((c) => c.id === contactId) : undefined));
  const isEdit = Boolean(contactId);

  return (
    <Dialog open={formState.open} onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex max-h-[min(92dvh,760px)] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle>{isEdit ? "Edit contact" : "Add a new contact"}</DialogTitle>
          <DialogDescription>
            {isEdit && contact
              ? `Update ${getFullName(contact)}'s details. Changes are recorded in the activity timeline.`
              : "Capture the essentials now. You can add notes and follow-ups from the profile."}
          </DialogDescription>
        </DialogHeader>
        {/* Keyed so each open starts from fresh default values. */}
        {formState.open ? (
          <ContactForm key={contactId ?? "new"} contact={contact} onDone={close} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ContactForm({ contact, onDone }: { contact?: Contact; onDone: () => void }) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues, unknown, ContactFormOutput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: contact ? toFormValues(contact) : EMPTY_CONTACT_FORM,
    mode: "onTouched",
  });

  const onSubmit = (values: ContactFormOutput) => {
    if (isEmailTaken(crm().contacts, values.email, contact?.id)) {
      setError("email", { message: "Another contact already uses this email address" });
      setFocus("email");
      return;
    }

    const input = toContactInput(values);
    if (contact) {
      const ok = crm().updateContact(contact.id, input);
      if (!ok) {
        toast.error("This contact no longer exists", { description: "It may have been deleted in another tab." });
        onDone();
        return;
      }
      toast.success("Contact updated");
    } else {
      const created = crm().createContact(input);
      toast.success(`${getFullName(created)} added`, {
        action: { label: "View profile", onClick: () => router.push(`/contacts/${created.id}`) },
      });
    }
    onDone();
  };

  const matterOptions = withCurrent(MATTER_TYPES, contact?.matterType);
  const sourceOptions = withCurrent(CONTACT_SOURCES, contact?.source);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <fieldset className="space-y-4">
          <legend className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Personal information
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="firstName" label="First name" required error={errors.firstName?.message}>
              {(p) => <Input {...p} {...register("firstName")} placeholder="e.g. Layla" autoComplete="given-name" autoFocus />}
            </FormField>
            <FormField id="lastName" label="Last name" required error={errors.lastName?.message}>
              {(p) => <Input {...p} {...register("lastName")} placeholder="e.g. Rahman" autoComplete="family-name" />}
            </FormField>
            <FormField id="email" label="Email" required error={errors.email?.message}>
              {(p) => <Input {...p} {...register("email")} type="email" inputMode="email" placeholder="name@company.ae" autoComplete="email" />}
            </FormField>
            <FormField id="phone" label="Phone" required error={errors.phone?.message} hint="Include the country code, e.g. +971">
              {(p) => <Input {...p} {...register("phone")} type="tel" inputMode="tel" placeholder="+971 50 123 4567" autoComplete="tel" />}
            </FormField>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Matter details
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="status" label="Status" required error={errors.status?.message}>
              {(p) => (
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger {...p} ref={field.ref} onBlur={field.onBlur} className="w-full">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            <StatusDot status={status} />
                            {STATUS_META[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>
            <FormField id="company" label="Company or organisation" error={errors.company?.message}>
              {(p) => <Input {...p} {...register("company")} placeholder="e.g. Sandstone Logistics LLC" autoComplete="organization" />}
            </FormField>
            <OptionalSelect id="matterType" label="Matter type" control={control} options={matterOptions} placeholder="Select a practice area" />
            <OptionalSelect id="source" label="Contact source" control={control} options={sourceOptions} placeholder="How did they find us?" />
          </div>
          <FormField
            id="additionalInformation"
            label="Additional information"
            error={errors.additionalInformation?.message}
            hint="Context for the team: availability, language preference, referral details."
          >
            {(p) => (
              <Textarea
                {...p}
                {...register("additionalInformation")}
                rows={3}
                placeholder="e.g. Prefers calls after 2pm; Arabic and English."
                className="resize-y"
              />
            )}
          </FormField>
        </fieldset>
      </div>

      <DialogFooter className="border-t bg-muted/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {contact ? "Save changes" : "Create contact"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function withCurrent(options: readonly string[], current?: string) {
  return current && !options.includes(current) ? [...options, current] : [...options];
}

interface OptionalSelectProps {
  id: "matterType" | "source";
  label: string;
  placeholder: string;
  options: string[];
  control: ReturnType<typeof useForm<ContactFormValues, unknown, ContactFormOutput>>["control"];
}

function OptionalSelect({ id, label, placeholder, options, control }: OptionalSelectProps) {
  return (
    <FormField id={id} label={label}>
      {(p) => (
        <Controller
          control={control}
          name={id}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value === NONE ? "" : value)}
            >
              <SelectTrigger {...p} ref={field.ref} onBlur={field.onBlur} className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE} className="text-muted-foreground">
                  Not specified
                </SelectItem>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}
    </FormField>
  );
}
