import type { ReactNode } from "react";
import { BriefcaseBusiness, ShieldCheck, UserRound } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Contact } from "@/types/contact";
import { formatDateTime, formatRelative } from "@/lib/format";

export function ContactInfo({ contact }: { contact: Contact }) {
  return (
    <div className="space-y-4">
      <InfoCard icon={UserRound} title="Personal information">
        <Row label="First name">{contact.firstName}</Row>
        <Row label="Last name">{contact.lastName}</Row>
        <Row label="Email">
          <a href={`mailto:${contact.email}`} className="break-all text-foreground underline-offset-2 hover:text-bronze-800 hover:underline">
            {contact.email}
          </a>
        </Row>
        <Row label="Phone">
          <span className="tabular-nums">{contact.phone}</span>
        </Row>
      </InfoCard>

      <InfoCard icon={BriefcaseBusiness} title="Professional information">
        <Row label="Company">{contact.company}</Row>
        <Row label="Matter type">{contact.matterType}</Row>
        <Row label="Contact source">{contact.source}</Row>
      </InfoCard>

      <InfoCard icon={ShieldCheck} title="Relationship">
        <Row label="Current status">
          <StatusBadge status={contact.status} />
        </Row>
        <Row label="Date created">
          <time dateTime={contact.createdAt}>{formatDateTime(contact.createdAt)}</time>
        </Row>
        <Row label="Last updated">
          <time dateTime={contact.updatedAt} title={formatDateTime(contact.updatedAt)}>
            {formatRelative(contact.updatedAt)}
          </time>
        </Row>
        <div className="space-y-1 pt-1">
          <dt className="text-xs text-muted-foreground">Additional information</dt>
          <dd className="text-sm leading-relaxed whitespace-pre-line">
            {contact.additionalInformation ?? <span className="text-subtle-foreground">Nothing recorded</span>}
          </dd>
        </div>
      </InfoCard>
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: typeof UserRound; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card shadow-xs">
      <h2 className="flex items-center gap-2 border-b px-5 py-3.5 text-md font-semibold">
        <Icon className="size-4 text-brand-bronze" aria-hidden />
        {title}
      </h2>
      <dl className="space-y-3 px-5 py-4">{children}</dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{children ?? <span className="text-subtle-foreground">Not provided</span>}</dd>
    </div>
  );
}
