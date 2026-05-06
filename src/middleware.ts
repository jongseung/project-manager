import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "pm-user-id";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files and API cron routes
  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  const userId = req.cookies.get(COOKIE_NAME)?.value;

  // If no session cookie, redirect to /setup to auto-provision
  if (!userId && pathname !== "/setup") {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  // If has cookie but visiting /setup, redirect to dashboard
  if (userId && pathname === "/setup") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg|public|api).*)"],
};
