/** The signed-in user as exposed to the client (never includes credentials). */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}
