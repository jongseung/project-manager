import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "pm-user-id";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API cron routes.
  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  const userId = req.cookies.get(COOKIE_NAME)?.value;

  // Public landing at "/" — visitors without a session see the marketing page
  // (the root page itself sends returning, logged-in users into the app).
  if (pathname === "/") {
    return NextResponse.next();
  }

  // If no session cookie, redirect to /setup to auto-provision.
  // (We intentionally do NOT redirect away from /setup when a cookie exists —
  // it may be stale; /setup re-validates and self-heals the session.)
  if (!userId && pathname !== "/setup") {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  // Project root → land on the 흐름(flow) overview (or open a deep-linked task
  // on the board). Done here, before the app layout streams, for a clean 307.
  const projectRoot = pathname.match(/^\/projects\/([^/]+)\/?$/);
  if (projectRoot) {
    const task = req.nextUrl.searchParams.get("task");
    const dest = task
      ? `/projects/${projectRoot[1]}/board?task=${task}`
      : `/projects/${projectRoot[1]}/flow`;
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg|public|api).*)"],
};
