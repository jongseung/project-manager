"use server";

import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import type { Notification } from "@prisma/client";

export async function createNotification(input: {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}): Promise<ActionResult<Notification>> {
  try {
    const notification = await db.notification.create({ data: input });
    return success(notification);
  } catch {
    return failure("Failed to create notification");
  }
}

export async function getNotifications(recipientId: string, limit = 20): Promise<Notification[]> {
  return db.notification.findMany({
    where: { recipientId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(recipientId: string): Promise<number> {
  return db.notification.count({
    where: { recipientId, read: false },
  });
}

export async function markAsRead(id: string): Promise<ActionResult<void>> {
  try {
    await db.notification.update({ where: { id }, data: { read: true } });
    return success(undefined);
  } catch {
    return failure("Failed to mark as read");
  }
}

export async function markAllAsRead(recipientId: string): Promise<ActionResult<void>> {
  try {
    await db.notification.updateMany({ where: { recipientId, read: false }, data: { read: true } });
    return success(undefined);
  } catch {
    return failure("Failed to mark all as read");
  }
}
