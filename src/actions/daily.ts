"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { todayDateString } from "@/lib/utils";
import { getCurrentOrgId, userOwnsTask, userOwnsProject } from "@/lib/session";
import type { DailyPlan } from "@prisma/client";

// NOTE: DailyPlan has no workspace/org relation in schema — one plan per date globally.
// Tenant isolation requires a schema migration.

async function getOrCreateDailyPlan(date: string, organizationId: string): Promise<DailyPlan> {
  const existing = await db.dailyPlan.findUnique({
    where: { organizationId_date: { organizationId, date } },
  });
  if (existing) return existing;
  return db.dailyPlan.create({ data: { date, organizationId } });
}

export async function addToDailyPlan(
  taskId: string,
  date?: string
): Promise<ActionResult<void>> {
  if (!(await userOwnsTask(taskId))) return failure("태스크에 접근 권한이 없습니다");
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("Unauthorized");
  const planDate = date ?? todayDateString();

  try {
    const plan = await getOrCreateDailyPlan(planDate, orgId);

    const existing = await db.dailyPlanTask.findUnique({
      where: { dailyPlanId_taskId: { dailyPlanId: plan.id, taskId } },
    });
    if (existing) return success(undefined);

    const maxOrder = await db.dailyPlanTask.aggregate({
      where: { dailyPlanId: plan.id },
      _max: { sortOrder: true },
    });

    await db.dailyPlanTask.create({
      data: {
        dailyPlanId: plan.id,
        taskId,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });

    revalidatePath("/today");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to add task to daily plan");
  }
}

export async function removeFromDailyPlan(
  taskId: string,
  date?: string
): Promise<ActionResult<void>> {
  if (!(await userOwnsTask(taskId))) return failure("태스크에 접근 권한이 없습니다");
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("Unauthorized");
  const planDate = date ?? todayDateString();

  try {
    const plan = await db.dailyPlan.findUnique({
      where: { organizationId_date: { organizationId: orgId, date: planDate } },
    });
    if (!plan) return success(undefined);

    await db.dailyPlanTask.deleteMany({
      where: { dailyPlanId: plan.id, taskId },
    });

    revalidatePath("/today");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to remove task from daily plan");
  }
}

export async function getDailyPlan(date?: string) {
  const orgId = await getCurrentOrgId();
  if (!orgId) return null;
  const planDate = date ?? todayDateString();

  const plan = await db.dailyPlan.findUnique({
    where: { organizationId_date: { organizationId: orgId, date: planDate } },
    include: {
      tasks: {
        where: { task: { project: { workspace: { organizationId: orgId } } } },
        include: {
          task: {
            include: {
              labels: { include: { label: true } },
              project: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return plan;
}

export async function quickAddToToday(
  projectId: string,
  title: string
): Promise<ActionResult<void>> {
  if (!(await userOwnsProject(projectId))) return failure("프로젝트에 접근 권한이 없습니다");
  try {
    const today = new Date().toISOString().split("T")[0];
    const task = await db.task.create({
      data: {
        projectId,
        title,
        status: "todo",
        priority: "none",
        dueDate: today,
      },
    });

    await addToDailyPlan(task.id);
    revalidatePath("/today");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to create task");
  }
}
