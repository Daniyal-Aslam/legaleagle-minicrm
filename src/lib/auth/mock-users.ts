import "server-only";
import type { DemoAccount, SessionUser } from "@/types/user";

interface MockUserRecord extends SessionUser {
  /** SHA-256 of the demo password. Real systems would use a slow KDF (argon2/bcrypt). */
  passwordHash: string;
}

/**
 * Fictional intake team accounts. This module is the mock "user database"
 * behind /api/auth/*; it only ever runs on the server.
 * Demo password for every account: Eagle@2026
 */
const MOCK_USERS: MockUserRecord[] = [
  {
    id: "usr_mariam",
    name: "Mariam Al Hashimi",
    email: "mariam@legaleagle.test",
    role: "Intake Coordinator",
    initials: "MA",
    passwordHash: "48ffddc74c15d8facf338f71bde046566f5a460e82667f63f8a3148e1e95ff2a",
  },
  {
    id: "usr_yousef",
    name: "Yousef Khalil",
    email: "yousef@legaleagle.test",
    role: "Senior Associate",
    initials: "YK",
    passwordHash: "48ffddc74c15d8facf338f71bde046566f5a460e82667f63f8a3148e1e95ff2a",
  },
];

export const DEMO_PASSWORD_HINT = "Eagle@2026";

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toSessionUser(record: MockUserRecord): SessionUser {
  const { id, name, email, role, initials } = record;
  return { id, name, email, role, initials };
}

export async function verifyCredentials(email: string, password: string): Promise<SessionUser | null> {
  const user = MOCK_USERS.find((u) => u.email === email.trim().toLowerCase());
  const hash = await sha256Hex(password);
  // Hash even when the user is unknown so timing doesn't reveal valid emails.
  if (!user || !constantTimeEqual(hash, user.passwordHash)) return null;
  return toSessionUser(user);
}

export function findUserById(id: string): SessionUser | null {
  const user = MOCK_USERS.find((u) => u.id === id);
  return user ? toSessionUser(user) : null;
}

export function listDemoAccounts(): DemoAccount[] {
  return MOCK_USERS.map(({ name, email, role, initials }) => ({ name, email, role, initials }));
}
