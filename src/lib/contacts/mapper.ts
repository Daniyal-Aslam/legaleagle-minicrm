import type { Contact, ContactInput } from "@/types/contact";
import type { ContactFormOutput, ContactFormValues } from "@/schemas/contact";

const optional = (value: string) => (value.trim() ? value.trim() : undefined);

/** Validated form output → domain input (empty optionals become undefined). */
export function toContactInput(values: ContactFormOutput): ContactInput {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email.toLowerCase(),
    phone: values.phone.replace(/\s+/g, " "),
    status: values.status,
    company: optional(values.company),
    matterType: optional(values.matterType),
    source: optional(values.source),
    additionalInformation: optional(values.additionalInformation),
  };
}

export const EMPTY_CONTACT_FORM: ContactFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  status: "lead",
  company: "",
  matterType: "",
  source: "",
  additionalInformation: "",
};

export function toFormValues(contact: Contact): ContactFormValues {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    status: contact.status,
    company: contact.company ?? "",
    matterType: contact.matterType ?? "",
    source: contact.source ?? "",
    additionalInformation: contact.additionalInformation ?? "",
  };
}
