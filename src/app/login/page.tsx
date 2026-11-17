import type { Metadata } from "next";
import Image from "next/image";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

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
    <main className="grid min-h-dvh bg-card lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Form column */}
      <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-12 lg:px-16 xl:px-24">
        <header className="flex items-center gap-3">
          <Image src="/brand/legal-eagle-mark.png" alt="" width={240} height={200} priority className="h-8 w-auto" />
          <span className="font-heading text-md font-semibold text-brand-ink">Legal Eagle</span>
        </header>

        <div className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-[26rem] lg:mx-0">
            <SignInForm next={next} />
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Legal Eagle UAE</span>
          <span>Authorised personnel only</span>
        </footer>
      </div>

      {/* Brand panel */}
      <aside
        aria-hidden
        className="relative isolate hidden flex-col justify-end overflow-hidden bg-brand-ink p-14 lg:flex xl:p-20"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50rem_35rem_at_100%_0%,color-mix(in_oklab,var(--brand-gold)_22%,transparent),transparent_70%)]" />
        <Image
          src="/brand/legal-eagle-mark.png"
          alt=""
          width={240}
          height={200}
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 w-[26rem] max-w-none -translate-x-1/2 -translate-y-[60%] opacity-[0.08]"
        />
        <p className="max-w-lg font-heading text-5xl leading-[1.08] font-semibold text-white">
          Every matter begins with a <span className="text-brand-gold">first conversation.</span>
        </p>
        <p className="mt-5 max-w-md text-md text-ink-300">
          Track enquiries, notes and follow ups for every client in one place.
        </p>
      </aside>
    </main>
  );
}
