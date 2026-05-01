"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { logActivity } from "./activity";
import { milestoneSchema } from "@/lib/validators";
import { userOwnsProject, userOwnsMilestone } from "@/lib/session";
import type { Milestone } from "@prisma/client";

export async function createMilestone(input: unknown): Promise<ActionResult<Milestone>> {
  const parsed = milestoneSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsProject(parsed.data.projectId))) return failure("프로젝트에 접근 권한이 없습니다");

  try {
    const maxOrder = await db.milestone.aggregate({ where: { projectId: parsed.data.projectId }, _max: { sortOrder: true } });
    const milestone = await db.milestone.create({
      data: { ...parsed.data, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
    });
    await logActivity("milestone", milestone.id, "created", { name: milestone.name });
    revalidatePath("/", "layout");
    return success(milestone);
  } catch (e) {
    console.error(e);
    return failure("마일스톤 생성에 실패했습니다");
  }
}

export async function updateMilestone(id: string, input: unknown): Promise<ActionResult<Milestone>> {
  const parsed = milestoneSchema.partial().safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsMilestone(id))) return failure("마일스톤에 접근 권한이 없습니다");

  try {
    const milestone = await db.milestone.update({ where: { id }, data: { ...parsed.data, ...(parsed.data.status === "reached" ? { reachedAt: new Date() } : {}) } });
    await logActivity("milestone", milestone.id, "updated");
    revalidatePath("/", "layout");
    return success(milestone);
  } catch (e) {
    console.error(e);
    return failure("마일스톤 수정에 실패했습니다");
  }
}

export async function deleteMilestone(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsMilestone(id))) return failure("마일스톤에 접근 권한이 없습니다");
  try {
    await db.milestone.update({ where: { id }, data: { archivedAt: new Date() } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("마일스톤 삭제에 실패했습니다");
  }
}

export async function restoreMilestone(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsMilestone(id))) return failure("마일스톤에 접근 권한이 없습니다");
  try {
    await db.milestone.update({ where: { id }, data: { archivedAt: null } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("마일스톤 복원에 실패했습니다");
  }
}

export async function purgeMilestone(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsMilestone(id))) return failure("마일스톤에 접근 권한이 없습니다");
  try {
    await db.milestone.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("영구 삭제에 실패했습니다");
  }
}
