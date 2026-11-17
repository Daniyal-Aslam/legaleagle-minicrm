"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/state-panels";
import type { Note } from "@/types/contact";
import { noteSchema } from "@/schemas/contact";
import { useSessionUser } from "@/components/auth/session-provider";
import { formatDateTime, formatRelative } from "@/lib/format";
import { pluralize } from "@/lib/utils";
import { crm, useContactNotes } from "@/store";

const MAX = 2000;

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function NotesPanel({ contactId }: { contactId: string }) {
  const notes = useContactNotes(contactId);

  return (
    <section aria-labelledby="notes-heading" className="rounded-xl border bg-card shadow-xs">
      <header className="flex items-center justify-between border-b px-5 py-3.5">
        <h2 id="notes-heading" className="text-md font-semibold">
          Notes
        </h2>
        <span className="text-xs text-muted-foreground">{pluralize(notes.length, "note")}</span>
      </header>
      <NoteComposer contactId={contactId} />
      {notes.length ? (
        <ol className="divide-y">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))}
        </ol>
      ) : (
        <EmptyState
          compact
          icon={NotebookPen}
          title="No notes yet"
          description="Capture call outcomes, client preferences or next steps so the whole team has context."
        />
      )}
    </section>
  );
}

function NoteComposer({ contactId }: { contactId: string }) {
  const user = useSessionUser();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string>();

  const submit = () => {
    const result = noteSchema.safeParse({ content });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    if (crm().addNote(contactId, result.data.content)) {
      setContent("");
      setError(undefined);
      toast.success("Note added");
    }
  };

  return (
    <form
      className="border-b bg-muted/30 px-5 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor="new-note" className="sr-only">
        New note
      </label>
      <Textarea
        id="new-note"
        value={content}
        maxLength={MAX}
        rows={3}
        onChange={(e) => {
          setContent(e.target.value);
          if (error) setError(undefined);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "new-note-error" : "new-note-hint"}
        placeholder="Add a note about this contact…"
        className="min-h-20 resize-y bg-card"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        {error ? (
          <p id="new-note-error" role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : (
          <p id="new-note-hint" className="text-xs text-muted-foreground">
            <span className="hidden sm:inline">Ctrl + Enter to save · </span>Posting as {user.name}
          </p>
        )}
        <Button type="submit" size="sm" disabled={!content.trim()}>
          Add note
        </Button>
      </div>
    </form>
  );
}

function NoteItem({ note }: { note: Note }) {
  return (
    <li className="flex gap-3 px-5 py-4">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-ink font-heading text-2xs font-semibold text-brand-gold"
      >
        {initialsOf(note.author)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
          <span className="font-medium text-foreground">{note.author}</span>
          <time dateTime={note.createdAt} title={formatDateTime(note.createdAt)} className="text-muted-foreground">
            {formatDateTime(note.createdAt)} · {formatRelative(note.createdAt)}
          </time>
        </p>
        <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-line">{note.content}</p>
      </div>
    </li>
  );
}
