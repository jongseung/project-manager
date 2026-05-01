"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { logActivity } from "./activity";
import { goalSchema } from "@/lib/validators";
import { getCurrentOrgId, userOwnsWorkspace, userOwnsGoal, userOwnsProject } from "@/lib/session";
import type { Goal } from "@prisma/client";

export async function createGoal(input: unknown): Promise<ActionResult<Goal>> {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsWorkspace(parsed.data.workspaceId))) {
    return failure("워크스페이스에 접근 권한이 없습니다");
  }
  try {
    const goal = await db.goal.create({ data: parsed.data });
    await logActivity("goal", goal.id, "created", { title: goal.title });
    revalidatePath("/goals");
    return success(goal);
  } catch (e) {
    console.error(e);
    return failure("목표 생성에 실패했습니다");
  }
}

export async function updateGoal(id: string, input: unknown): Promise<ActionResult<Goal>> {
  const parsed = goalSchema.partial().safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsGoal(id))) return failure("목표에 접근 권한이 없습니다");
  try {
    const goal = await db.goal.update({ where: { id }, data: parsed.data });
    await logActivity("goal", goal.id, "updated");
    revalidatePath("/goals");
    return success(goal);
  } catch (e) {
    console.error(e);
    return failure("목표 수정에 실패했습니다");
  }
}

/**
 * Soft-delete: moves goal to trash. Use purgeGoal() to permanently delete.
 */
export async function deleteGoal(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsGoal(id))) return failure("목표에 접근 권한이 없습니다");
  try {
    await db.goal.update({ where: { id }, data: { archivedAt: new Date() } });
    await logActivity("goal", id, "deleted");
    revalidatePath("/goals");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("목표 삭제에 실패했습니다");
  }
}

export async function restoreGoal(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsGoal(id))) return failure("목표에 접근 권한이 없습니다");
  try {
    await db.goal.update({ where: { id }, data: { archivedAt: null } });
    revalidatePath("/goals");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("목표 복원에 실패했습니다");
  }
}

export async function purgeGoal(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsGoal(id))) return failure("목표에 접근 권한이 없습니다");
  try {
    await db.goal.delete({ where: { id } });
    await logActivity("goal", id, "purged");
    revalidatePath("/goals");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("영구 삭제에 실패했습니다");
  }
}

export async function linkProjectToGoal(goalId: string, projectId: string): Promise<ActionResult<void>> {
  if (!(await userOwnsGoal(goalId)) || !(await userOwnsProject(projectId))) {
    return failure("권한이 없습니다");
  }
  try {
    await db.goalProject.create({ data: { goalId, projectId } });
    revalidatePath("/goals");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("프로젝트 연결에 실패했습니다");
  }
}

export async function unlinkProjectFromGoal(goalId: string, projectId: string): Promise<ActionResult<void>> {
  if (!(await userOwnsGoal(goalId))) return failure("권한이 없습니다");
  try {
    await db.goalProject.delete({ where: { goalId_projectId: { goalId, projectId } } });
    revalidatePath("/goals");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("프로젝트 연결 해제에 실패했습니다");
  }
}

export async function getGoalsWithProgress(workspaceId?: string) {
  const orgId = await getCurrentOrgId();
  if (!orgId) return [];
  const goals = await db.goal.findMany({
    where: {
      workspace: { organizationId: orgId },
      archivedAt: null,
      ...(workspaceId ? { workspaceId } : {}),
    },
    include: {
      kpis: true,
      projectLinks: {
        include: {
          project: {
            include: { tasks: { select: { id: true, status: true }, where: { archivedAt: null } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return goals.map((goal) => {
    const allTasks = goal.projectLinks.flatMap((l) => l.project.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "done").length;
    return {
      ...goal,
      totalTasks,
      completedTasks,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  });
}
