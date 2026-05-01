"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { epicSchema } from "@/lib/validators";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { logActivity } from "./activity";
import { userOwnsProject, userOwnsEpic } from "@/lib/session";
import type { Epic } from "@prisma/client";

export async function createEpic(input: unknown): Promise<ActionResult<Epic>> {
  const parsed = epicSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsProject(parsed.data.projectId))) return failure("프로젝트에 접근 권한이 없습니다");

  try {
    const maxOrder = await db.epic.aggregate({
      where: { projectId: parsed.data.projectId },
      _max: { sortOrder: true },
    });
    const epic = await db.epic.create({
      data: { ...parsed.data, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
    });
    await logActivity("epic", epic.id, "created", { name: epic.name });
    revalidatePath("/", "layout");
    return success(epic);
  } catch (e) {
    console.error(e);
    return failure("에픽 생성에 실패했습니다");
  }
}

export async function updateEpic(id: string, input: unknown): Promise<ActionResult<Epic>> {
  const parsed = epicSchema.partial().safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsEpic(id))) return failure("에픽에 접근 권한이 없습니다");

  try {
    const epic = await db.epic.update({ where: { id }, data: parsed.data });
    await logActivity("epic", epic.id, "updated");
    revalidatePath("/", "layout");
    return success(epic);
  } catch (e) {
    console.error(e);
    return failure("에픽 수정에 실패했습니다");
  }
}

export async function deleteEpic(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsEpic(id))) return failure("에픽에 접근 권한이 없습니다");
  try {
    await db.epic.update({ where: { id }, data: { archivedAt: new Date() } });
    await logActivity("epic", id, "deleted");
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("에픽 삭제에 실패했습니다");
  }
}

export async function restoreEpic(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsEpic(id))) return failure("에픽에 접근 권한이 없습니다");
  try {
    await db.epic.update({ where: { id }, data: { archivedAt: null } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("에픽 복원에 실패했습니다");
  }
}

export async function purgeEpic(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsEpic(id))) return failure("에픽에 접근 권한이 없습니다");
  try {
    await db.epic.delete({ where: { id } });
    await logActivity("epic", id, "purged");
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("영구 삭제에 실패했습니다");
  }
}

export async function getEpicsWithProgress(projectId: string) {
  if (!(await userOwnsProject(projectId))) return [];
  const epics = await db.epic.findMany({
    where: { projectId, archivedAt: null },
    include: {
      tasks: { select: { id: true, status: true }, where: { archivedAt: null } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return epics.map((epic) => ({
    ...epic,
    taskCount: epic.tasks.length,
    completedCount: epic.tasks.filter((t) => t.status === "done").length,
  }));
}
