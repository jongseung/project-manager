"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { format, subDays } from "date-fns";
import { getCurrentOrgId, requireOrganization } from "@/lib/session";
import type { StandupNote } from "@prisma/client";

// NOTE: StandupNote has no workspace/org relation in schema — one note per date globally.
// Proper multi-tenancy needs a schema migration (composite key: [orgId, date]).
// For now, every query in this action file is tenant-scoped where possible and
// only authenticated callers are allowed through.

export async function getStandupData(date: string) {
  // Layout enforces auth+org membership; redirect on failure to keep the return non-null.
  const ctx = await requireOrganization();
  const orgId = ctx.organization.id;

  const yesterday = format(subDays(new Date(date), 1), "yyyy-MM-dd");
  const weekAgo = format(subDays(new Date(date), 7), "yyyy-MM-dd");
  const orgScope = { project: { workspace: { organizationId: orgId } } };

  const [
    yesterdayTasks,
    todayDue,
    inProgress,
    overdue,
    recentMilestones,
    projects,
    notes,
    yesterdayActivity,
    activeSprints,
  ] = await Promise.all([
    db.task.findMany({
      where: {
        ...orgScope,
        completedAt: {
          gte: new Date(`${yesterday}T00:00:00`),
          lt: new Date(`${date}T00:00:00`),
        },
        parentTaskId: null,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        member: { select: { name: true } },
      },
      orderBy: { completedAt: "desc" },
    }),

    db.task.findMany({
      where: { ...orgScope, dueDate: date, status: { notIn: ["done", "cancelled"] }, archivedAt: null, parentTaskId: null },
      include: {
        project: { select: { id: true, name: true, color: true } },
        member: { select: { name: true } },
      },
      orderBy: [{ priority: "asc" }, { sortOrder: "asc" }],
    }),

    db.task.findMany({
      where: {
        ...orgScope,
        status: "in_progress",
        archivedAt: null,
        parentTaskId: null,
        OR: [{ dueDate: null }, { dueDate: { lte: date } }],
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        member: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 15,
    }),

    db.task.findMany({
      where: { ...orgScope, dueDate: { lt: date }, status: { notIn: ["done", "cancelled"] }, archivedAt: null, parentTaskId: null },
      include: {
        project: { select: { id: true, name: true, color: true } },
        member: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),

    db.milestone.findMany({
      where: {
        status: "reached",
        reachedAt: { gte: new Date(`${weekAgo}T00:00:00`) },
        project: { workspace: { organizationId: orgId } },
      },
      include: { project: { select: { name: true } } },
      orderBy: { reachedAt: "desc" },
      take: 5,
    }),

    db.project.findMany({
      where: { status: "active", archivedAt: null, workspace: { organizationId: orgId } },
      include: {
        tasks: { where: { archivedAt: null, parentTaskId: null }, select: { status: true, completedAt: true } },
      },
    }),

    db.standupNote.findUnique({ where: { organizationId_date: { organizationId: orgId, date } } }),

    db.activityLog.count({
      where: {
        organizationId: orgId,
        occurredAt: { gte: new Date(`${yesterday}T00:00:00`), lt: new Date(`${date}T00:00:00`) },
        entityId: { not: "workflow-sim" },
      },
    }),

    db.sprint.findMany({
      where: { status: "active", project: { workspace: { organizationId: orgId } } },
      include: {
        project: { select: { name: true } },
        tasks: { include: { task: { select: { status: true } } } },
      },
    }),
  ]);

  const projectProgress = projects.map((p) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === "done").length;
    const recentlyDone = p.tasks.filter(
      (t) => t.completedAt && format(t.completedAt, "yyyy-MM-dd") >= weekAgo
    ).length;
    return { id: p.id, name: p.name, color: p.color, total, done, recentlyDone, progress: total > 0 ? Math.round((done / total) * 100) : 0 };
  }).filter((p) => p.total > 0);

  const sprintSummary = activeSprints.map((s) => {
    const total = s.tasks.length;
    const done = s.tasks.filter((t) => t.task.status === "done").length;
    return { id: s.id, name: s.name, projectName: s.project.name, total, done, endDate: s.endDate };
  });

  return {
    date,
    yesterday: yesterdayTasks,
    todayDue,
    inProgress,
    overdue,
    recentMilestones,
    projectProgress,
    sprintSummary,
    notes,
    yesterdayActivity,
  };
}

export async function saveStandupNote(
  date: string,
  data: {
    yesterday?: string;
    today?: string;
    blockers?: string;
    actionItems?: string;
    retro?: string;
  }
): Promise<ActionResult<StandupNote>> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");
  try {
    const note = await db.standupNote.upsert({
      where: { organizationId_date: { organizationId: orgId, date } },
      create: { date, organizationId: orgId, ...data },
      update: data,
    });
    revalidatePath("/standup");
    return success(note);
  } catch (e) {
    console.error(e);
    return failure("저장에 실패했습니다");
  }
}

export async function toggleMeetingTimer(
  date: string,
  action: "start" | "end"
): Promise<ActionResult<StandupNote>> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");
  try {
    const field = action === "start" ? "meetingStartedAt" : "meetingEndedAt";
    const note = await db.standupNote.upsert({
      where: { organizationId_date: { organizationId: orgId, date } },
      create: { date, organizationId: orgId, [field]: new Date() },
      update: { [field]: new Date() },
    });
    revalidatePath("/standup");
    return success(note);
  } catch (e) {
    console.error(e);
    return failure("타이머 저장에 실패했습니다");
  }
}
