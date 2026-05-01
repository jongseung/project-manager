"use server";

import { db } from "@/lib/db";

type EntityType = "task" | "project" | "epic" | "goal" | "milestone" | "sprint" | "kpi" | "recurring" | "story" | "objective";
type ActionType = "created" | "updated" | "deleted" | "status_changed" | "moved" | "completed" | "archived" | "purged" | "restored";

export async function logActivity(
  entityType: EntityType,
  entityId: string,
  action: ActionType,
  details?: Record<string, unknown>
) {
  // Scope to current org when available so the activity log is tenant-filterable.
  const { getCurrentOrgId } = await import("@/lib/session");
  const organizationId = await getCurrentOrgId();
  await db.activityLog.create({
    data: {
      entityType,
      entityId,
      action,
      organizationId,
      details: details ? JSON.stringify(details) : null,
    },
  });
}
