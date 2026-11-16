import type { Metadata } from "next";
import Image from "next/image";
import { PipelinePreview, type PreviewCard } from "@/components/auth/pipeline-preview";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { DEMO_PASSWORD_HINT, listDemoAccounts } from "@/lib/auth/mock-users";
import { createSeedData } from "@/lib/seed";
import { CONTACT_STATUSES } from "@/types/contact";

export const metadata: Metadata = { title: "Sign in" };

/** Only allow same-origin relative redirects after sign-in. */
function safeNext(value: string | string[] | undefined) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/** A handful of sample contacts per stage for the animated board preview. */
function previewCards(): PreviewCard[] {
  const { contacts } = createSeedData();
  return CONTACT_STATUSES.flatMap((status) =>
    contacts
      .filter((c) => c.status === status)
      .slice(0, 3)
      .map(({ id, firstName, lastName, matterType }) => ({ id, firstName, lastName, matterType, status })),
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNext((await searchParams).next);

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-brand-ink">
      {/* Atmosphere: warm glow, faint dot grid and a large eagle watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_85%_-10%,color-mix(in_oklab,var(--brand-gold)_18%,transparent),transparent_70%),radial-gradient(40rem_30rem_at_0%_110%,color-mix(in_oklab,var(--brand-bronze)_14%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />
      <Image
        src="/brand/legal-eagle-mark.png"
        alt=""
        aria-hidden
        width={240}
        height={200}
        className="pointer-events-none absolute -bottom-24 -left-24 -z-10 w-[34rem] max-w-none opacity-[0.04]"
      />

      <div className="mx-auto flex min-h-dvh w-full max-w-[90rem] flex-col px-5 py-6 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/brand/legal-eagle-mark.png" alt="Legal Eagle" width={240} height={200} priority className="h-9 w-auto" />
            <div className="leading-tight">
              <p className="font-heading text-md font-semibold text-white">Legal Eagle</p>
              <p className="text-2xs font-medium tracking-[0.14em] text-brand-gold uppercase">Client Intake</p>
            </div>
          </div>
          <span className="hidden rounded-full border border-white/10 px-3 py-1 text-xs text-ink-300 sm:inline">
            Internal workspace
          </span>
        </header>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
          <SignInPanel next={next} accounts={listDemoAccounts()} demoPassword={DEMO_PASSWORD_HINT} />

          <div className="hidden justify-end lg:flex">
            <div className="w-full max-w-[44rem]">
              <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-ink-300 uppercase">
                Inside the workspace
              </p>
              <PipelinePreview cards={previewCards()} />
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500">
          <span>© {new Date().getFullYear()} Legal Eagle UAE</span>
          <span>Mock authentication · fictional sample data</span>
        </footer>
      </div>
    </main>
  );
}
