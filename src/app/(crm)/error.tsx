"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/state-panels";

export default function CrmError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border bg-card shadow-xs">
      <ErrorState
        description="This view hit an unexpected problem. Your saved contacts are unaffected — try again, or head back to the contact list."
        action={
          <>
            <Button onClick={reset}>
              <RotateCcw aria-hidden />
              Try again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contacts">Go to contacts</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
