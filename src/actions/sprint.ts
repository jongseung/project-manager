"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { logActivity } from "./activity";
import { sprintSchema } from "@/lib/validators";
import { userOwnsProject, userOwnsSprint, userOwnsTask } from "@/lib/session";
import type { Sprint } from "@prisma/client";

export async function createSprint(input: unknown): Promise<ActionResult<Sprint>> {
  const parsed = sprintSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsProject(parsed.data.projectId))) return failure("프로젝트에 접근 권한이 없습니다");

  if (parsed.data.status === "active") {
    const existing = await db.sprint.findFirst({
      where: { projectId: parsed.data.projectId, status: "active" },
    });
    if (existing) return failure("A project can only have one active sprint");
  }

  try {
    const sprint = await db.sprint.create({ data: parsed.data });
    await logActivity("sprint", sprint.id, "created", { name: sprint.name });
    revalidatePath("/", "layout");
    return success(sprint);
  } catch (e) {
    console.error(e);
    return failure("스프린트 생성에 실패했습니다");
  }
}

export async function updateSprint(id: string, input: unknown): Promise<ActionResult<Sprint>> {
  const parsed = sprintSchema.partial().safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsSprint(id))) return failure("스프린트에 접근 권한이 없습니다");

  if (parsed.data.status === "active") {
    const sprint = await db.sprint.findUnique({ where: { id } });
    if (sprint) {
      const existing = await db.sprint.findFirst({
        where: { projectId: sprint.projectId, status: "active", id: { not: id } },
      });
      if (existing) return failure("A project can only have one active sprint");
    }
  }

  try {
    const sprint = await db.sprint.update({ where: { id }, data: parsed.data });
    await logActivity("sprint", sprint.id, "updated");
    revalidatePath("/", "layout");
    return success(sprint);
  } catch (e) {
    console.error(e);
    return failure("스프린트 수정에 실패했습니다");
  }
}

export async function assignTaskToSprint(sprintId: string, taskId: string): Promise<ActionResult<void>> {
  if (!(await userOwnsSprint(sprintId)) || !(await userOwnsTask(taskId))) return failure("권한이 없습니다");
  try {
    await db.sprintTask.create({ data: { sprintId, taskId } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("태스크를 스프린트에 추가하는데 실패했습니다");
  }
}

export async function removeTaskFromSprint(sprintId: string, taskId: string): Promise<ActionResult<void>> {
  if (!(await userOwnsSprint(sprintId))) return failure("권한이 없습니다");
  try {
    await db.sprintTask.delete({ where: { sprintId_taskId: { sprintId, taskId } } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("태스크를 스프린트에서 제거하는데 실패했습니다");
  }
}

export async function deleteSprint(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsSprint(id))) return failure("스프린트에 접근 권한이 없습니다");
  try {
    await db.sprint.update({ where: { id }, data: { archivedAt: new Date() } });
    await logActivity("sprint", id, "deleted");
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("스프린트 삭제에 실패했습니다");
  }
}

export async function restoreSprint(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsSprint(id))) return failure("스프린트에 접근 권한이 없습니다");
  try {
    await db.sprint.update({ where: { id }, data: { archivedAt: null } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("스프린트 복원에 실패했습니다");
  }
}

export async function purgeSprint(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsSprint(id))) return failure("스프린트에 접근 권한이 없습니다");
  try {
    await db.sprint.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("영구 삭제에 실패했습니다");
  }
}

export async function getSprintsWithTasks(projectId: string) {
  if (!(await userOwnsProject(projectId))) return [];
  return db.sprint.findMany({
    where: { projectId, archivedAt: null },
    include: {
      tasks: {
        include: { task: { select: { id: true, title: true, status: true, priority: true, storyId: true } } },
      },
    },
    orderBy: { startDate: "desc" },
  });
}
