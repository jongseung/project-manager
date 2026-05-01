import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiOrg } from "@/lib/session";

export async function GET(request: Request) {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const notifications = await db.notification.findMany({
    where: { recipientId: ctx.userId },
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
    const notification = await db.notification.findUnique({ where: { id: body.id } });
    if (!notification || notification.recipientId !== ctx.userId) {
      return NextResponse.json({ error: "알림을 찾을 수 없습니다" }, { status: 404 });
    }
    await db.notification.update({ where: { id: body.id }, data: { read: true } });
    return NextResponse.json({ success: true });
  }

  if (body.action === "markAllAsRead") {
    await db.notification.updateMany({ where: { recipientId: ctx.userId, read: false }, data: { read: true } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
}
