import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactsView } from "@/components/contacts/contacts-view";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  // useSearchParams (filters in the URL) requires a Suspense boundary.
  return (
    <Suspense>
      <ContactsView />
    </Suspense>
  );
}
