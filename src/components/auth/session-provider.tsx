"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { SessionUser } from "@/types/user";
import { crm } from "@/store";

const SessionContext = createContext<SessionUser | null>(null);

/** Provides the server-verified user to client components. */
export function SessionProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  useEffect(() => {
    crm().setAuthor(user.name);
  }, [user.name]);

  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSessionUser(): SessionUser {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useSessionUser must be used inside <SessionProvider>");
  return user;
}
