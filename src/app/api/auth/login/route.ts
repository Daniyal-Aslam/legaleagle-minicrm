import { NextResponse } from "next/server";
import { loginSchema } from "@/schemas/auth";
import { verifyCredentials } from "@/lib/auth/mock-users";
import { sessionCookieOptions } from "@/lib/auth/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    // Deliberately generic: don't reveal which field was wrong.
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(user.id), {
    ...sessionCookieOptions,
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
