"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { objectiveSchema, keyResultSchema } from "@/lib/validators";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { logActivity } from "./activity";
import { userOwnsProject, userOwnsObjective, userOwnsKeyResult } from "@/lib/session";
import type { Objective, KeyResult } from "@prisma/client";

export async function createObjective(input: unknown): Promise<ActionResult<Objective>> {
  const parsed = objectiveSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsProject(parsed.data.projectId))) return failure("프로젝트에 접근 권한이 없습니다");

  try {
    const maxOrder = await db.objective.aggregate({
      where: { projectId: parsed.data.projectId },
      _max: { sortOrder: true },
    });
    const obj = await db.objective.create({
      data: { ...parsed.data, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
    });
    await logActivity("objective", obj.id, "created", { title: obj.title });
    revalidatePath("/", "layout");
    return success(obj);
  } catch (e) {
    console.error(e);
    return failure("Failed to create objective");
  }
}

export async function updateObjective(id: string, input: unknown): Promise<ActionResult<Objective>> {
  const parsed = objectiveSchema.partial().safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsObjective(id))) return failure("OKR에 접근 권한이 없습니다");

  try {
    const obj = await db.objective.update({ where: { id }, data: parsed.data });
    revalidatePath("/", "layout");
    return success(obj);
  } catch (e) {
    console.error(e);
    return failure("Failed to update objective");
  }
}

export async function deleteObjective(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsObjective(id))) return failure("OKR에 접근 권한이 없습니다");
  try {
    await db.objective.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to delete objective");
  }
}

export async function createKeyResult(input: unknown): Promise<ActionResult<KeyResult>> {
  const parsed = keyResultSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsObjective(parsed.data.objectiveId))) return failure("OKR에 접근 권한이 없습니다");

  try {
    const maxOrder = await db.keyResult.aggregate({
      where: { objectiveId: parsed.data.objectiveId },
      _max: { sortOrder: true },
    });
    const kr = await db.keyResult.create({
      data: { ...parsed.data, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
    });
    revalidatePath("/", "layout");
    return success(kr);
  } catch (e) {
    console.error(e);
    return failure("Failed to create key result");
  }
}

export async function updateKeyResult(id: string, input: unknown): Promise<ActionResult<KeyResult>> {
  const parsed = keyResultSchema.partial().safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsKeyResult(id))) return failure("KR에 접근 권한이 없습니다");

  try {
    const kr = await db.keyResult.update({ where: { id }, data: parsed.data });
    revalidatePath("/", "layout");
    return success(kr);
  } catch (e) {
    console.error(e);
    return failure("Failed to update key result");
  }
}

export async function deleteKeyResult(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsKeyResult(id))) return failure("KR에 접근 권한이 없습니다");
  try {
    await db.keyResult.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to delete key result");
  }
}

export async function recordKRSnapshot(keyResultId: string, value: number, note?: string): Promise<ActionResult<void>> {
  if (!(await userOwnsKeyResult(keyResultId))) return failure("KR에 접근 권한이 없습니다");
  try {
    await db.$transaction([
      db.kRSnapshot.create({ data: { keyResultId, value, note } }),
      db.keyResult.update({ where: { id: keyResultId }, data: { currentValue: value } }),
    ]);
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to record snapshot");
  }
}

export async function getProjectObjectives(projectId: string) {
  if (!(await userOwnsProject(projectId))) return [];
  return db.objective.findMany({
    where: { projectId },
    include: {
      keyResults: {
        include: {
          snapshots: { orderBy: { recordedAt: "desc" }, take: 10 },
          storyLinks: { include: { story: { select: { id: true, title: true, status: true } } } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}
