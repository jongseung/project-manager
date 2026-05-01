"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { taskSchema, taskUpdateSchema } from "@/lib/validators";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { userOwnsProject, userOwnsTask } from "@/lib/session";
import { logActivity } from "./activity";
import { addDays, addWeeks, addMonths, format } from "date-fns";
import type { Task } from "@prisma/client";

function calculateNextDate(currentDate: string, recurrence: string): string {
  const date = new Date(currentDate);
  switch (recurrence) {
    case "daily": return format(addDays(date, 1), "yyyy-MM-dd");
    case "weekly": return format(addWeeks(date, 1), "yyyy-MM-dd");
    case "monthly": return format(addMonths(date, 1), "yyyy-MM-dd");
    default: return currentDate;
  }
}

async function validateSubtaskDepth(parentTaskId: string | null | undefined): Promise<boolean> {
  if (!parentTaskId) return true;

  const parent = await db.task.findUnique({
    where: { id: parentTaskId },
    select: { parentTaskId: true },
  });

  if (!parent) return false;

  // If parent already has a parent, we're at depth 2 — reject
  if (parent.parentTaskId) return false;

  return true;
}

export async function createTask(
  input: unknown
): Promise<ActionResult<Task>> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  }

  // Ownership: caller must own the target project
  if (!(await userOwnsProject(parsed.data.projectId))) {
    return failure("프로젝트에 접근 권한이 없습니다");
  }

  const { parentTaskId } = parsed.data;
  if (parentTaskId) {
    const valid = await validateSubtaskDepth(parentTaskId);
    if (!valid) {
      return failure("하위 태스크는 2단계 이상 중첩할 수 없습니다");
    }
    // And the parent task must also belong to this user
    if (!(await userOwnsTask(parentTaskId))) {
      return failure("상위 태스크에 접근 권한이 없습니다");
    }
  }

  try {
    const maxOrder = await db.task.aggregate({
      where: { projectId: parsed.data.projectId, parentTaskId: parentTaskId ?? null },
      _max: { sortOrder: true },
    });

    const task = await db.task.create({
      data: {
        ...parsed.data,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });

    await logActivity("task", task.id, "created", { title: task.title });
    revalidatePath("/", "layout");
    return success(task);
  } catch (e) {
    console.error(e);
    return failure("태스크 생성에 실패했습니다");
  }
}

export async function updateTask(
  input: unknown
): Promise<ActionResult<Task>> {
  const parsed = taskUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  }

  const { id, ...data } = parsed.data;

  // Ownership
  if (!(await userOwnsTask(id))) {
    return failure("태스크에 접근 권한이 없습니다");
  }

  try {
    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) return failure("태스크를 찾을 수 없습니다");

    const updateData: Record<string, unknown> = { ...data };

    // Set completedAt when status changes to done
    if (data.status === "done" && existing.status !== "done") {
      updateData.completedAt = new Date();
      await logActivity("task", id, "completed");
    } else if (data.status && data.status !== "done" && existing.status === "done") {
      updateData.completedAt = null;
    }

    if (data.status && data.status !== existing.status) {
      await logActivity("task", id, "status_changed", {
        from: existing.status,
        to: data.status,
      });
    }

    const task = await db.task.update({
      where: { id },
      data: updateData,
    });

    // Auto-create next occurrence for recurring tasks
    if (data.status === "done" && existing.recurrence && existing.recurrence !== "none") {
      const nextDueDate = existing.dueDate ? calculateNextDate(existing.dueDate, existing.recurrence) : null;
      await db.task.create({
        data: {
          projectId: existing.projectId,
          epicId: existing.epicId,
          memberId: existing.memberId,
          title: existing.title,
          description: existing.description,
          priority: existing.priority,
          status: "todo",
          recurrence: existing.recurrence,
          dueDate: nextDueDate,
          estimatedHours: existing.estimatedHours,
        },
      });
    }

    revalidatePath("/", "layout");
    return success(task);
  } catch (e) {
    console.error(e);
    return failure("태스크 수정에 실패했습니다");
  }
}

/**
 * Soft-delete: sets archivedAt. Use purgeTask() to permanently delete.
 * (archiveTask alias kept for legacy callers.)
 */
export async function deleteTask(
  id: string
): Promise<ActionResult<void>> {
  if (!(await userOwnsTask(id))) {
    return failure("태스크에 접근 권한이 없습니다");
  }
  try {
    await db.task.update({ where: { id }, data: { archivedAt: new Date() } });
    await logActivity("task", id, "deleted");
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("태스크 삭제에 실패했습니다");
  }
}

export async function restoreTask(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsTask(id))) return failure("태스크에 접근 권한이 없습니다");
  try {
    await db.task.update({ where: { id }, data: { archivedAt: null } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("태스크 복원에 실패했습니다");
  }
}

export async function purgeTask(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsTask(id))) return failure("태스크에 접근 권한이 없습니다");
  try {
    await db.task.delete({ where: { id } });
    await logActivity("task", id, "purged");
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("영구 삭제에 실패했습니다");
  }
}

/**
 * Shared helper — guard any bulk op: all taskIds must belong to caller's org.
 * Returns null on success, failure ActionResult otherwise.
 */
const BULK_LIMIT = 200;

async function assertBulkOwnership(taskIds: string[]): Promise<null | ActionResult<never>> {
  if (taskIds.length === 0) return null;
  if (taskIds.length > BULK_LIMIT) return failure(`일괄 작업은 최대 ${BULK_LIMIT}건까지 가능합니다`);
  const { getCurrentOrgId } = await import("@/lib/session");
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");
  const owned = await db.task.count({
    where: {
      id: { in: taskIds },
      project: { workspace: { organizationId: orgId } },
    },
  });
  if (owned !== taskIds.length) return failure("일부 태스크에 접근 권한이 없습니다");
  return null;
}

export async function bulkDeleteTasks(
  taskIds: string[],
): Promise<ActionResult<{ affected: number }>> {
  const gate = await assertBulkOwnership(taskIds);
  if (gate) return gate;
  try {
    const { count } = await db.task.updateMany({
      where: { id: { in: taskIds } },
      data: { archivedAt: new Date() },
    });
    revalidatePath("/", "layout");
    return success({ affected: count });
  } catch (e) {
    console.error(e);
    return failure("일괄 삭제에 실패했습니다");
  }
}

export async function bulkRestoreTasks(
  taskIds: string[],
): Promise<ActionResult<{ affected: number }>> {
  const gate = await assertBulkOwnership(taskIds);
  if (gate) return gate;
  try {
    const { count } = await db.task.updateMany({
      where: { id: { in: taskIds } },
      data: { archivedAt: null },
    });
    revalidatePath("/", "layout");
    return success({ affected: count });
  } catch (e) {
    console.error(e);
    return failure("일괄 복원에 실패했습니다");
  }
}

export async function bulkAssignMember(
  taskIds: string[],
  memberId: string | null,
): Promise<ActionResult<{ affected: number }>> {
  const gate = await assertBulkOwnership(taskIds);
  if (gate) return gate;
  try {
    const { count } = await db.task.updateMany({
      where: { id: { in: taskIds } },
      data: { memberId },
    });
    revalidatePath("/", "layout");
    return success({ affected: count });
  } catch (e) {
    console.error(e);
    return failure("일괄 담당자 변경에 실패했습니다");
  }
}

export async function bulkSetPriority(
  taskIds: string[],
  priority: string,
): Promise<ActionResult<{ affected: number }>> {
  const gate = await assertBulkOwnership(taskIds);
  if (gate) return gate;
  try {
    const { count } = await db.task.updateMany({
      where: { id: { in: taskIds } },
      data: { priority },
    });
    revalidatePath("/", "layout");
    return success({ affected: count });
  } catch (e) {
    console.error(e);
    return failure("일괄 우선순위 변경에 실패했습니다");
  }
}

export async function archiveTask(
  id: string
): Promise<ActionResult<Task>> {
  if (!(await userOwnsTask(id))) {
    return failure("태스크에 접근 권한이 없습니다");
  }
  try {
    const task = await db.task.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    await logActivity("task", id, "archived");
    revalidatePath("/", "layout");
    return success(task);
  } catch (e) {
    console.error(e);
    return failure("태스크 보관에 실패했습니다");
  }
}

export async function reorderTasks(
  tasks: { id: string; sortOrder: number; status?: string }[]
): Promise<ActionResult<void>> {
  if (tasks.length === 0) return success(undefined);
  // Ownership: check all ids belong to caller's org in a single query
  const { getCurrentOrgId } = await import("@/lib/session");
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");
  const owned = await db.task.count({
    where: {
      id: { in: tasks.map((t) => t.id) },
      project: { workspace: { organizationId: orgId } },
    },
  });
  if (owned !== tasks.length) return failure("태스크에 접근 권한이 없습니다");

  try {
    await db.$transaction(
      tasks.map((t) =>
        db.task.update({
          where: { id: t.id },
          data: {
            sortOrder: t.sortOrder,
            ...(t.status ? { status: t.status } : {}),
          },
        })
      )
    );
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("태스크 정렬에 실패했습니다");
  }
}
