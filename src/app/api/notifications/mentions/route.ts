import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiOrg } from "@/lib/session";

// NOTE: Notification model has no workspace/org relation in schema (recipientId is a bare string).
// For this turn we require auth. Full tenant scoping requires a schema migration to add
// organizationId (or workspaceId) on Notification and backfill.
export async function GET(request: Request) {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get("recipientId");
  const where = recipientId ? { recipientId } : {};

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(request: Request) {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const body = await request.json();

  if (body.action === "markAsRead" && body.id) {
    await db.notification.update({ where: { id: body.id }, data: { read: true } });
    return NextResponse.json({ success: true });
  }

  if (body.action === "markAllAsRead") {
    const where = body.recipientId ? { recipientId: body.recipientId, read: false } : { read: false };
    await db.notification.updateMany({ where, data: { read: true } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
