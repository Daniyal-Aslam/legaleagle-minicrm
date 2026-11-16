import type { Metadata } from "next";
import { ContactDetailView } from "@/components/contact-details/contact-detail-view";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Data lives in the browser, so existence is resolved client-side after hydration.
  return <ContactDetailView contactId={decodeURIComponent(id)} />;
}
