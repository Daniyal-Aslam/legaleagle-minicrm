import { z } from "zod";
import { CONTACT_STATUSES } from "@/types/contact";

const PHONE_PATTERN = /^\+?[\d\s\-()]+$/;

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer`);

/** Shared by the create and edit forms. Optional fields use "" for empty. */
export const contactFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(60, "First name must be 60 characters or fewer"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(60, "Last name must be 60 characters or fewer"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address, e.g. name@company.ae")),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(PHONE_PATTERN, "Use digits, spaces, dashes or a leading +")
    .refine((value) => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15;
    }, "Phone number should contain 7–15 digits"),
  status: z.enum(CONTACT_STATUSES, { error: "Select a status" }),
  company: optionalText(100, "Company"),
  matterType: optionalText(60, "Matter type"),
  source: optionalText(60, "Source"),
  additionalInformation: optionalText(1000, "Additional information"),
});

export type ContactFormValues = z.input<typeof contactFormSchema>;
export type ContactFormOutput = z.output<typeof contactFormSchema>;

export const noteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Write something before saving the note")
    .max(2000, "Notes are limited to 2,000 characters"),
});
