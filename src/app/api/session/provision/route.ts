import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "pm-user-id";
const DEFAULT_USER_EMAIL = "user@local";
const DEFAULT_USER_NAME = "사용자";
const DEFAULT_ORG_NAME = "내 조직";

/**
 * Auto-provisions a default user and organization on first visit.
 * Sets a long-lived cookie with the user ID.
 * Later this will be replaced with SSO.
 */
export async function POST() {
  const cookieStore = await cookies();

  // If already has a cookie pointing to a real user, we're done.
  // A stale cookie (user no longer exists, e.g. after a DB reset) falls
  // through to re-provision and reset the cookie — preventing a redirect loop.
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) {
    const valid = await db.user.findUnique({
      where: { id: existing },
      select: { id: true },
    });
    if (valid) return NextResponse.json({ ok: true });
  }

  // Find or create default user
  let user = await db.user.findUnique({ where: { email: DEFAULT_USER_EMAIL } });

  if (!user) {
    user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: DEFAULT_USER_NAME,
          email: DEFAULT_USER_EMAIL,
        },
      });

      await tx.organization.create({
        data: {
          name: DEFAULT_ORG_NAME,
          slug: `org-${newUser.id.slice(0, 8)}`,
          members: {
            create: { userId: newUser.id, role: "owner" },
          },
        },
      });

      return newUser;
    });
  }

  // Set cookie (1 year expiry)
  const response = NextResponse.json({ ok: true, userId: user.id });
  response.cookies.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60, // 1 year
  });

  return response;
}
