/** The signed-in user as exposed to the client (never includes credentials). */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}

/** Public details of a mock account, shown on the sign-in screen. */
export type DemoAccount = Pick<SessionUser, "name" | "email" | "role" | "initials">;
