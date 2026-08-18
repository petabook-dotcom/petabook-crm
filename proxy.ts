import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, isValidAccessCookie } from "@/lib/access/session";

export function proxy(request: NextRequest) {
  const hasAccess = isValidAccessCookie(request.cookies.get(ACCESS_COOKIE_NAME)?.value);
  const isAccessPage = request.nextUrl.pathname === "/access";

  if (!hasAccess && !isAccessPage) {
    const redirectUrl = new URL("/access", request.url);
    redirectUrl.searchParams.set("from", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (hasAccess && isAccessPage) {
    return NextResponse.redirect(new URL("/pipeline", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
