"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { loginSchema } from "@/schemas/auth";
import type { DemoAccount } from "@/types/user";
import { cn } from "@/lib/utils";

type Mode = "persona" | "email";
type Phase = "idle" | "submitting" | "entering";

interface Props {
  next: string;
  accounts: DemoAccount[];
  demoPassword: string;
}

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Time-aware greeting computed on the client only (avoids hydration mismatch). */
function useGreeting() {
  return useSyncExternalStore(
    () => () => {},
    () => greetingFor(new Date().getHours()),
    () => "Welcome",
  );
}

const darkInput =
  "h-11 w-full rounded-lg border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none transition-[border-color,box-shadow] placeholder:text-ink-500 focus:border-brand-gold focus:ring-[3px] focus:ring-brand-gold/25 aria-[invalid=true]:border-destructive";

export function SignInPanel({ next, accounts, demoPassword }: Props) {
  const router = useRouter();
  const greeting = useGreeting();
  const [mode, setMode] = useState<Mode>("persona");
  const [selected, setSelected] = useState<DemoAccount | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const busy = phase !== "idle";

  const choose = (account: DemoAccount) => {
    setSelected(account);
    setEmail(account.email);
    setPassword(demoPassword);
    setError(null);
    setFieldErrors({});
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setSelected(null);
    setEmail("");
    setPassword("");
    setError(null);
    setFieldErrors({});
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setFieldErrors({});
    setError(null);
    setPhase("submitting");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "We couldn't sign you in. Please try again.");
        setPhase("idle");
        return;
      }
      setPhase("entering");
      router.replace(next);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setPhase("idle");
    }
  };

  if (phase === "entering") {
    return (
      <div role="status" className="animate-in fade-in flex flex-col items-start gap-4 duration-300">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold ring-1 ring-brand-gold/30">
          <Check className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-heading text-3xl font-semibold text-white">
            Welcome, {(selected?.name ?? email).split(/[ @]/)[0]}.
          </p>
          <p className="mt-1 flex items-center gap-2 text-sidebar-foreground">
            <Loader2 className="size-4 animate-spin text-brand-gold" aria-hidden />
            Opening your intake workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="text-sm font-medium text-brand-gold">{greeting}.</p>
      <h1 className="mt-2 font-heading text-[2.25rem] leading-[1.1] font-semibold text-white sm:text-5xl">
        {mode === "persona" ? (
          <>
            Who&apos;s on the
            <br />
            intake desk today?
          </>
        ) : (
          "Sign in with email"
        )}
      </h1>
      <p className="mt-3 max-w-md text-sidebar-foreground">
        {mode === "persona"
          ? "Pick your profile to step into the workspace. Notes and activity you record are signed with your name."
          : "Use your work email and password to continue."}
      </p>

      {error ? (
        <div
          role="alert"
          className="animate-in fade-in mt-6 flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/15 px-3.5 py-3 text-sm text-white"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          {error}
        </div>
      ) : null}

      <form onSubmit={submit} noValidate className="mt-8">
        {mode === "persona" ? (
          <div role="group" aria-label="Choose your profile" className="space-y-3">
            {accounts.map((account) => {
              const isSelected = selected?.email === account.email;
              const dimmed = selected !== null && !isSelected;
              return (
                <div
                  key={account.email}
                  className={cn(
                    "rounded-2xl border transition-[border-color,background-color,opacity] duration-200",
                    isSelected
                      ? "border-brand-gold/70 bg-white/[0.07]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]",
                    dimmed && "opacity-50 hover:opacity-80",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => choose(account)}
                    aria-pressed={isSelected}
                    className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl p-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-brand-gold/40"
                  >
                    <span
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold transition-colors",
                        isSelected ? "bg-brand-gold text-brand-ink" : "bg-white/10 text-brand-gold group-hover:bg-white/15",
                      )}
                    >
                      {account.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-white">{account.name}</span>
                      <span className="block truncate text-sm text-ink-300">{account.role}</span>
                    </span>
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border transition-all",
                        isSelected
                          ? "border-brand-gold bg-brand-gold text-brand-ink"
                          : "border-white/15 text-ink-300 group-hover:translate-x-0.5 group-hover:border-white/30 group-hover:text-white",
                      )}
                      aria-hidden
                    >
                      {isSelected ? <Check className="size-4" /> : <ArrowRight className="size-4" />}
                    </span>
                  </button>

                  {isSelected ? (
                    <div className="animate-in fade-in slide-in-from-top-1 space-y-3 px-4 pb-4 duration-200">
                      <PasswordField
                        value={password}
                        onChange={setPassword}
                        show={showPassword}
                        onToggle={() => setShowPassword((v) => !v)}
                        error={fieldErrors.password}
                        hint={`Mock account · password pre-filled (${demoPassword})`}
                        autoFocus
                      />
                      <SubmitButton busy={phase === "submitting"} label={`Continue as ${account.name.split(" ")[0]}`} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-white">
                Work email
              </label>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@legaleagle.test"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                className={darkInput}
              />
              {fieldErrors.email ? (
                <p id="login-email-error" className="text-xs text-white/80">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>
            <PasswordField
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              error={fieldErrors.password}
              label
            />
            <SubmitButton busy={phase === "submitting"} label="Sign in" />
          </div>
        )}
      </form>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {mode === "persona" ? (
          <button
            type="button"
            onClick={() => switchMode("email")}
            className="inline-flex cursor-pointer items-center gap-2 rounded text-ink-300 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-brand-gold/40"
          >
            <Mail className="size-4" aria-hidden />
            Sign in with email instead
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode("persona")}
            className="inline-flex cursor-pointer items-center gap-2 rounded text-ink-300 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-brand-gold/40"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to profiles
          </button>
        )}
      </div>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
  error,
  hint,
  label = false,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
  hint?: string;
  label?: boolean;
  autoFocus?: boolean;
}) {
  const describedBy = error ? "login-password-error" : hint ? "login-password-hint" : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor="login-password" className={label ? "text-sm font-medium text-white" : "sr-only"}>
        Password
      </label>
      <div className="relative">
        <input
          id="login-password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Password"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(darkInput, "pr-11")}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-ink-300 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-gold/40"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error ? (
        <p id="login-password-error" className="text-xs text-white/80">
          {error}
        </p>
      ) : hint ? (
        <p id="login-password-hint" className="text-xs text-ink-300">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      className="group flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-bronze to-brand-gold text-sm font-semibold text-brand-ink shadow-lg shadow-brand-bronze/20 outline-none transition-[filter,box-shadow] hover:brightness-110 focus-visible:ring-[3px] focus-visible:ring-brand-gold/50 disabled:cursor-wait disabled:opacity-80"
    >
      {busy ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Signing in…
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </>
      )}
    </button>
  );
}
