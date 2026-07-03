import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // /admin and /api: skip next-intl entirely, but still inject the
  // x-pathname header so payload-totp can detect /admin routes from server
  // components (Payload doesn't expose req.pathname there).
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  }

  // Public site: run next-intl locale middleware, then attach x-pathname.
  const response = intlMiddleware(request);
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next|_vercel|media|.*\\..*).*)"],
};
