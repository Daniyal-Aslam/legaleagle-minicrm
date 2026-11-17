import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Image src="/brand/legal-eagle-mark.png" alt="Legal Eagle" width={96} height={80} className="h-16 w-auto" />
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-brand-bronze uppercase">Error 404</p>
        <h1 className="text-3xl font-semibold">This page doesn&apos;t exist</h1>
        <p className="max-w-md text-muted-foreground">
          The link may be outdated or mistyped. Head back to the workspace to continue.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/contacts">Go to contacts</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Overview</Link>
        </Button>
      </div>
    </main>
  );
}
