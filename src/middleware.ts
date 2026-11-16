import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/** Guards every app page: signed-out visitors go to /login, signed-in ones skip it. */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) !== null;
  const isLogin = pathname === "/login";

  if (!signedIn && !isLogin) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  if (signedIn && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals and static assets.
  matcher: ["/((?!api|_next/static|_next/image|brand|icon.png|favicon.ico).*)"],
};
