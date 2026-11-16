"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Radio } from "lucide-react";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { StatusDot } from "@/components/shared/status-badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CONTACT_STATUSES, type ContactStatus } from "@/types/contact";
import { STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface PreviewCard {
  id: string;
  firstName: string;
  lastName: string;
  matterType?: string;
  status: ContactStatus;
}

const STEP_MS = 2600;
const NEXT: Partial<Record<ContactStatus, ContactStatus>> = { lead: "active", active: "closed" };

/** Builds a looping script: alternately advance the oldest lead and the oldest active card. */
function buildScript(cards: PreviewCard[]) {
  const moves: { id: string; to: ContactStatus }[] = [];
  const state = new Map(cards.map((c) => [c.id, c.status]));
  for (let i = 0; i < 6; i++) {
    const from: ContactStatus = i % 2 === 0 ? "lead" : "active";
    const candidate = cards.find((c) => state.get(c.id) === from);
    if (!candidate) continue;
    const to = NEXT[from]!;
    state.set(candidate.id, to);
    moves.push({ id: candidate.id, to });
  }
  return moves;
}

/**
 * Decorative, self-running glimpse of the intake board built from the sample
 * dataset. Hidden from assistive tech; static when reduced motion is preferred.
 */
export function PipelinePreview({ cards }: { cards: PreviewCard[] }) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const script = useMemo(() => buildScript(cards), [cards]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reducedMotion || script.length === 0) return;
    const timer = window.setInterval(() => setStep((s) => (s + 1) % (script.length + 2)), STEP_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, script.length]);

  // Apply the first `step` moves (the two extra ticks hold the final state before looping).
  const applied = script.slice(0, Math.min(step, script.length));
  const statuses = new Map(cards.map((c) => [c.id, c.status]));
  for (const move of applied) statuses.set(move.id, move.to);
  const lastMove = applied[applied.length - 1];
  const lastCard = lastMove ? cards.find((c) => c.id === lastMove.id) : undefined;

  return (
    <div aria-hidden className="relative w-full max-w-[44rem] select-none">
      {/* Window chrome */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="ml-3 text-xs text-ink-300">Intake pipeline</span>
          <span className="ml-auto flex items-center gap-1.5 text-2xs font-medium tracking-[0.12em] text-brand-gold uppercase">
            <Radio className="size-3" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4">
          {CONTACT_STATUSES.map((status) => {
            const column = cards.filter((c) => statuses.get(c.id) === status);
            return (
              <div key={status} className="min-w-0 rounded-xl bg-white/[0.04] p-2.5">
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <StatusDot status={status} className="size-2" />
                  <span className="text-xs font-semibold text-white">{STATUS_META[status].label}</span>
                  <span className="ml-auto text-2xs text-ink-300 tabular-nums">{column.length}</span>
                </div>
                <ul className="space-y-2">
                  {column.map((card) => {
                    const justMoved = card.id === lastMove?.id;
                    return (
                      <li
                        // Remount on move so the card animates into its new column.
                        key={`${card.id}-${status}`}
                        className={cn(
                          "rounded-lg border bg-card p-2.5 transition-shadow",
                          justMoved
                            ? "animate-in fade-in slide-in-from-left-6 border-brand-gold ring-[3px] ring-brand-gold/25 duration-500"
                            : "border-transparent",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <ContactAvatar contact={card} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-foreground">
                              {card.firstName} {card.lastName}
                            </p>
                            <p className="truncate text-2xs text-muted-foreground">{card.matterType ?? "General enquiry"}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity ticker */}
      <div className="mt-4 flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-gold/60 motion-reduce:hidden" />
          <span className="relative inline-flex size-2 rounded-full bg-brand-gold" />
        </span>
        {lastCard && lastMove ? (
          <p key={step} className="animate-in fade-in slide-in-from-bottom-1 truncate text-sm text-sidebar-foreground duration-300">
            <span className="font-medium text-white">
              {lastCard.firstName} {lastCard.lastName}
            </span>{" "}
            moved to <span className="text-brand-gold">{STATUS_META[lastMove.to].label}</span>
            <span className="text-ink-500"> · just now</span>
          </p>
        ) : (
          <p className="truncate text-sm text-ink-300">
            Every move is recorded on the contact&apos;s timeline <ArrowRight className="inline size-3.5" />
          </p>
        )}
      </div>
    </div>
  );
}
