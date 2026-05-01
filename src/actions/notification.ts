"use server";

import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { getCurrentUser } from "@/lib/session";
import type { Notification } from "@prisma/client";

export async function createNotification(input: {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}): Promise<ActionResult<Notification>> {
  const user = await getCurrentUser();
  if (!user) return failure("인증이 필요합니다");
  try {
    const notification = await db.notification.create({ data: input });
    return success(notification);
  } catch {
    return failure("알림 생성에 실패했습니다");
  }
}

export async function getNotifications(limit = 20): Promise<Notification[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return db.notification.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  return db.notification.count({
    where: { recipientId: user.id, read: false },
  });
}

export async function markAsRead(id: string): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) return failure("인증이 필요합니다");
  try {
    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification || notification.recipientId !== user.id) return failure("인증이 필요합니다");
    await db.notification.update({ where: { id }, data: { read: true } });
    return success(undefined);
  } catch {
    return failure("읽음 처리에 실패했습니다");
  }
}

export async function markAllAsRead(): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) return failure("인증이 필요합니다");
  try {
    await db.notification.updateMany({ where: { recipientId: user.id, read: false }, data: { read: true } });
    return success(undefined);
  } catch {
    return failure("전체 읽음 처리에 실패했습니다");
  }
}
