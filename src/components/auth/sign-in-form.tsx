"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema } from "@/schemas/auth";
import { cn } from "@/lib/utils";

interface Props {
  next: string;
}

type Credentials = { email: string; password: string };

const fieldClass =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-md text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-brand-bronze focus:ring-[3px] focus:ring-brand-gold/25 disabled:opacity-60 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/15";

const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

export function SignInForm({ next }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  /** Which control started the request ("form" while submitting). */
  const [pending, setPending] = useState<string | null>(null);
  /** Set once the server accepts the credentials; holds the first name for the welcome screen. */
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  /** Bumped after a rejected password so focus returns to the (re-enabled) field. */
  const [retryFocus, setRetryFocus] = useState(0);

  useEffect(() => {
    if (retryFocus === 0) return;
    passwordRef.current?.focus();
    passwordRef.current?.select();
  }, [retryFocus]);
  const entering = welcomeName !== null;

  // Warm up the destination so the hand-off after sign-in is near-instant.
  useEffect(() => {
    router.prefetch(next);
  }, [router, next]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Credentials, string>>>({});

  const busy = pending !== null;

  const signIn = async (credentials: Credentials, source: string) => {
    if (busy) return;
    const parsed = loginSchema.safeParse(credentials);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setFieldErrors({});
    setError(null);
    setPending(source);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "We couldn't sign you in. Please try again.");
        setPending(null);
        // Put the cursor back where the fix usually is.
        if (source === "form" && response.status === 401) setRetryFocus((n) => n + 1);
        return;
      }
      const data = (await response.json().catch(() => null)) as { user?: { name?: string } } | null;
      setWelcomeName((data?.user?.name ?? parsed.data.email).split(/[ @]/)[0]);
      router.replace(next);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setPending(null);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void signIn({ email, password }, "form");
  };

  if (entering) {
    return (
      <div role="status" aria-live="polite" className="animate-in fade-in w-full duration-300">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-status-active-bg text-status-active-fg">
          <Check className="size-7" strokeWidth={2.5} aria-hidden />
        </span>
        <h1 className="mt-6 font-heading text-3xl leading-tight font-semibold text-brand-ink sm:text-4xl">
          Welcome, {welcomeName}
        </h1>
        <p className="mt-2 text-muted-foreground">You&apos;re signed in. Opening your workspace…</p>
        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full w-1/3 rounded-full bg-brand-gold motion-safe:animate-[login-progress_1.1s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:opacity-60" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl leading-tight font-semibold text-brand-ink sm:text-4xl">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">Sign in to Legal Eagle with your work account.</p>

      {error ? (
        <div
          role="alert"
          className="animate-in fade-in mt-6 flex items-start gap-2.5 border-l-4 border-destructive bg-destructive/8 px-4 py-3 text-sm text-foreground"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          {error}
        </div>
      ) : null}

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="login-email" className={labelClass}>
            Work email
          </label>
          <input
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            disabled={busy}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
            className={fieldClass}
          />
          {fieldErrors.email ? (
            <p id="login-email-error" className="mt-1.5 text-xs text-destructive">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
              className={cn(fieldClass, "pr-12")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p id="login-password-error" className="mt-1.5 text-xs text-destructive">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={busy}
          aria-busy={pending === "form"}
          className="group flex h-12 w-full cursor-pointer items-center justify-between rounded-xl bg-brand-ink pr-2 pl-5 text-sm font-semibold text-white outline-none transition-colors hover:bg-ink-800 focus-visible:ring-[3px] focus-visible:ring-brand-gold/50 disabled:cursor-wait disabled:opacity-85"
        >
          {pending === "form" ? "Signing in…" : "Sign in"}
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-gold text-brand-ink transition-transform group-hover:translate-x-0.5">
            {pending === "form" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="size-4" aria-hidden />
            )}
          </span>
        </button>
      </form>
    </div>
  );
}
