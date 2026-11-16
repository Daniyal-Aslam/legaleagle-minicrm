import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { DEMO_PASSWORD_HINT, listDemoAccounts } from "@/lib/auth/mock-users";

export const metadata: Metadata = { title: "Sign in" };

const HIGHLIGHTS = [
  "Every enquiry captured, searchable in seconds",
  "A clear intake pipeline from lead to closed",
  "Notes and a full activity history on every profile",
];

/** Only allow same-origin relative redirects after sign-in. */
function safeNext(value: string | string[] | undefined) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNext((await searchParams).next);

  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Brand panel */}
      <section
        aria-label="Legal Eagle"
        className="relative hidden overflow-hidden bg-brand-ink px-12 py-12 text-sidebar-foreground lg:flex lg:flex-col xl:px-16"
      >
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full border border-brand-gold/10" />
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-[20rem] rounded-full border border-brand-gold/10" />

        <div className="flex items-center gap-3">
          <Image src="/brand/legal-eagle-mark.png" alt="" width={240} height={200} priority className="h-10 w-auto" />
          <div className="leading-tight">
            <p className="font-heading text-lg font-semibold text-white">Legal Eagle</p>
            <p className="text-2xs font-medium tracking-[0.14em] text-brand-gold uppercase">Client Intake</p>
          </div>
        </div>

        <div className="my-auto max-w-md py-16">
          <div aria-hidden className="mb-6 h-px w-16 bg-gradient-to-r from-brand-bronze to-brand-gold" />
          <h1 className="font-heading text-4xl leading-tight font-semibold text-white xl:text-[2.75rem]">
            Client intake, handled with care.
          </h1>
          <p className="mt-4 text-md leading-relaxed text-ink-300">
            The workspace for Legal Eagle&apos;s intake team: track every prospective and existing client
            from first enquiry to closed engagement.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-sidebar-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-gold" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-ink-500">© {new Date().getFullYear()} Legal Eagle UAE · Internal use only</p>
      </section>

      {/* Form panel */}
      <section className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-[25rem]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/brand/legal-eagle-mark.png" alt="" width={240} height={200} priority className="h-9 w-auto" />
            <div className="leading-tight">
              <p className="font-heading text-md font-semibold">Legal Eagle</p>
              <p className="text-2xs font-medium tracking-[0.14em] text-brand-bronze uppercase">Client Intake</p>
            </div>
          </div>

          <h2 className="font-heading text-3xl font-semibold">Welcome back</h2>
          <p className="mt-1.5 text-muted-foreground">Sign in to the intake workspace.</p>

          <LoginForm next={next} demoAccounts={listDemoAccounts()} demoPassword={DEMO_PASSWORD_HINT} />
        </div>
      </section>
    </main>
  );
}
