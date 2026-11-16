import type { ReactNode } from "react";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { QuickFind } from "./quick-find";
import { Sidebar } from "./sidebar";
import { StoreHydrator } from "./store-hydrator";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-card px-3 py-2 text-sm shadow-md focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          <div className="mx-auto w-full max-w-[var(--content-max)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
      <StoreHydrator />
      <QuickFind />
      <ContactFormDialog />
    </div>
  );
}
