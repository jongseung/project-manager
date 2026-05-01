"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { recurringTemplateSchema, recurringTemplateUpdateSchema } from "@/lib/validators";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { logActivity } from "./activity";
import { calculateNextRun } from "@/lib/recurring-utils";
import { getCurrentOrgId, userOwnsWorkspace, userOwnsRecurringTemplate, userOwnsProject } from "@/lib/session";
import type { RecurringTemplate } from "@prisma/client";

export async function createRecurringTemplate(
  input: unknown
): Promise<ActionResult<RecurringTemplate>> {
  const parsed = recurringTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const { subtasks, daysOfWeek, labelIds, ...data } = parsed.data;

  if (!(await userOwnsWorkspace(data.workspaceId))) return failure("워크스페이스에 접근 권한이 없습니다");
  if (data.projectId && !(await userOwnsProject(data.projectId))) return failure("프로젝트에 접근 권한이 없습니다");

  try {
    const nextRunAt = calculateNextRun(
      new Date(),
      data.frequency,
      data.interval,
      daysOfWeek,
      data.dayOfMonth ?? null
    );

    const template = await db.recurringTemplate.create({
      data: {
        ...data,
        daysOfWeek: JSON.stringify(daysOfWeek),
        labelIds: JSON.stringify(labelIds),
        nextRunAt,
        subtaskTemplates: {
          create: subtasks.map((s, i) => ({ title: s.title, sortOrder: i })),
        },
      },
    });

    await logActivity("recurring", template.id, "created", { title: template.title });
    revalidatePath("/", "layout");
    return success(template);
  } catch (e) {
    console.error(e);
    return failure("Failed to create recurring template");
  }
}

export async function updateRecurringTemplate(
  input: unknown
): Promise<ActionResult<RecurringTemplate>> {
  const parsed = recurringTemplateUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const { id, subtasks, daysOfWeek, labelIds, ...data } = parsed.data;
  if (!(await userOwnsRecurringTemplate(id))) return failure("템플릿에 접근 권한이 없습니다");

  try {
    const updateData: Record<string, unknown> = { ...data };
    if (daysOfWeek !== undefined) updateData.daysOfWeek = JSON.stringify(daysOfWeek);
    if (labelIds !== undefined) updateData.labelIds = JSON.stringify(labelIds);

    if (data.frequency || data.interval || daysOfWeek || data.dayOfMonth !== undefined) {
      const existing = await db.recurringTemplate.findUnique({ where: { id } });
      if (existing) {
        const freq = data.frequency ?? existing.frequency;
        const intv = data.interval ?? existing.interval;
        const dow = daysOfWeek ?? JSON.parse(existing.daysOfWeek);
        const dom = data.dayOfMonth !== undefined ? data.dayOfMonth : existing.dayOfMonth;
        updateData.nextRunAt = calculateNextRun(new Date(), freq, intv, dow, dom ?? null);
      }
    }

    if (subtasks !== undefined) {
      await db.recurringSubtask.deleteMany({ where: { recurringId: id } });
      for (const [i, s] of subtasks.entries()) {
        await db.recurringSubtask.create({
          data: { recurringId: id, title: s.title, sortOrder: i },
        });
      }
    }

    const template = await db.recurringTemplate.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/", "layout");
    return success(template);
  } catch (e) {
    console.error(e);
    return failure("Failed to update recurring template");
  }
}

export async function deleteRecurringTemplate(
  id: string
): Promise<ActionResult<void>> {
  if (!(await userOwnsRecurringTemplate(id))) return failure("템플릿에 접근 권한이 없습니다");
  try {
    await db.recurringTemplate.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to delete recurring template");
  }
}

export async function toggleRecurringTemplate(
  id: string,
  isActive: boolean
): Promise<ActionResult<RecurringTemplate>> {
  if (!(await userOwnsRecurringTemplate(id))) return failure("템플릿에 접근 권한이 없습니다");
  try {
    const template = await db.recurringTemplate.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/", "layout");
    return success(template);
  } catch (e) {
    console.error(e);
    return failure("Failed to toggle recurring template");
  }
}

/**
 * Internal: runs a template. When called from a user action, the caller MUST
 * verify ownership first. Called by cron/recurring route and triggerRecurringTemplate.
 */
async function runRecurringTemplate(id: string): Promise<ActionResult<{ taskId: string }>> {
  try {
    const template = await db.recurringTemplate.findUnique({
      where: { id },
      include: { subtaskTemplates: { orderBy: { sortOrder: "asc" } } },
    });
    if (!template) return failure("Template not found");
    if (!template.projectId) return failure("Template has no project assigned");

    const labelIds: string[] = JSON.parse(template.labelIds);
    const today = new Date().toISOString().split("T")[0];

    const task = await db.task.create({
      data: {
        projectId: template.projectId,
        memberId: template.memberId,
        title: template.title,
        description: template.description,
        priority: template.priority,
        status: "todo",
        dueDate: today,
        recurringTemplateId: template.id,
        recurrence: template.frequency,
      },
    });

    for (const [i, st] of template.subtaskTemplates.entries()) {
      await db.task.create({
        data: {
          projectId: template.projectId!,
          parentTaskId: task.id,
          title: st.title,
          sortOrder: i,
          status: "todo",
        },
      });
    }

    if (labelIds.length > 0) {
      for (const labelId of labelIds) {
        await db.taskLabel.create({ data: { taskId: task.id, labelId } }).catch(() => {});
      }
    }

    const daysOfWeek: number[] = JSON.parse(template.daysOfWeek);
    const nextRunAt = calculateNextRun(
      new Date(),
      template.frequency,
      template.interval,
      daysOfWeek,
      template.dayOfMonth
    );

    await db.recurringTemplate.update({
      where: { id },
      data: { lastRunAt: new Date(), nextRunAt },
    });

    revalidatePath("/", "layout");
    return success({ taskId: task.id });
  } catch (e) {
    console.error(e);
    return failure("Failed to trigger recurring template");
  }
}

export async function triggerRecurringTemplate(
  id: string
): Promise<ActionResult<{ taskId: string }>> {
  if (!(await userOwnsRecurringTemplate(id))) return failure("템플릿에 접근 권한이 없습니다");
  return runRecurringTemplate(id);
}

export async function getRecurringTemplates(workspaceId: string) {
  if (!(await userOwnsWorkspace(workspaceId))) return [];
  return db.recurringTemplate.findMany({
    where: { workspaceId },
    include: {
      subtaskTemplates: { orderBy: { sortOrder: "asc" } },
      _count: { select: { tasks: true } },
    },
    orderBy: [{ isActive: "desc" }, { frequency: "asc" }, { title: "asc" }],
  });
}

export async function getAllRecurringTemplates() {
  const orgId = await getCurrentOrgId();
  if (!orgId) return [];
  return db.recurringTemplate.findMany({
    where: { workspace: { organizationId: orgId } },
    include: {
      subtaskTemplates: { orderBy: { sortOrder: "asc" } },
      _count: { select: { tasks: true } },
    },
    orderBy: [{ isActive: "desc" }, { frequency: "asc" }, { title: "asc" }],
  });
}

/** Process all due recurring templates — called by cron endpoint (bearer-auth protected). */
export async function processRecurringTemplates(): Promise<{ created: number; errors: number }> {
  const now = new Date();
  const templates = await db.recurringTemplate.findMany({
    where: { isActive: true, nextRunAt: { lte: now } },
    include: { subtaskTemplates: { orderBy: { sortOrder: "asc" } } },
  });

  let created = 0;
  let errors = 0;

  for (const template of templates) {
    if (!template.projectId) {
      errors++;
      continue;
    }

    try {
      const result = await runRecurringTemplate(template.id);
      if (result.success) created++;
      else errors++;
    } catch {
      errors++;
    }
  }

  return { created, errors };
}
