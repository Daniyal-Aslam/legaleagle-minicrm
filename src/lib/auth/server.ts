import "server-only";
import { cookies } from "next/headers";
import type { SessionUser } from "@/types/user";
import { findUserById } from "./mock-users";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** Resolves the signed-in user from the session cookie (server components / route handlers). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = await verifySessionToken(token);
  return userId ? findUserById(userId) : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
