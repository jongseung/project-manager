"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { projectSchema } from "@/lib/validators";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { getCurrentOrgId, userOwnsProject, userOwnsWorkspace } from "@/lib/session";
import { logActivity } from "./activity";
import type { Project } from "@prisma/client";

export async function createProject(
  input: unknown
): Promise<ActionResult<Project>> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  // Workspace must belong to caller
  if (!(await userOwnsWorkspace(parsed.data.workspaceId))) {
    return failure("워크스페이스에 접근 권한이 없습니다");
  }

  try {
    const project = await db.project.create({ data: parsed.data });
    await logActivity("project", project.id, "created", { name: project.name });
    revalidatePath("/", "layout");
    return success(project);
  } catch (e) {
    console.error(e);
    return failure("Failed to create project");
  }
}

export async function updateProject(
  id: string,
  input: unknown
): Promise<ActionResult<Project>> {
  const parsed = projectSchema.partial().safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  if (!(await userOwnsProject(id))) {
    return failure("프로젝트에 접근 권한이 없습니다");
  }

  try {
    const project = await db.project.update({
      where: { id },
      data: parsed.data,
    });
    await logActivity("project", project.id, "updated");
    revalidatePath("/", "layout");
    return success(project);
  } catch (e) {
    console.error(e);
    return failure("Failed to update project");
  }
}

/**
 * Soft-delete: moves the project to trash (archivedAt = now).
 * Use purgeProject() to permanently delete.
 */
export async function deleteProject(
  id: string
): Promise<ActionResult<void>> {
  if (!(await userOwnsProject(id))) {
    return failure("프로젝트에 접근 권한이 없습니다");
  }
  try {
    await db.project.update({ where: { id }, data: { archivedAt: new Date() } });
    await logActivity("project", id, "deleted");
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to delete project");
  }
}

export async function restoreProject(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsProject(id))) return failure("프로젝트에 접근 권한이 없습니다");
  try {
    await db.project.update({ where: { id }, data: { archivedAt: null } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to restore project");
  }
}

export async function purgeProject(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsProject(id))) return failure("프로젝트에 접근 권한이 없습니다");
  try {
    await db.project.delete({ where: { id } });
    await logActivity("project", id, "purged");
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("영구 삭제에 실패했습니다");
  }
}

export async function getProject(id: string) {
  const orgId = await getCurrentOrgId();
  if (!orgId) return null;
  return db.project.findFirst({
    where: { id, archivedAt: null, workspace: { organizationId: orgId } },
    include: {
      tasks: {
        where: { archivedAt: null, parentTaskId: null },
        include: {
          labels: { include: { label: true } },
          subtasks: { orderBy: { sortOrder: "asc" } },
          member: { select: { id: true, name: true, color: true } },
          comments: { orderBy: { createdAt: "desc" }, take: 5 },
          epic: { select: { id: true, name: true } },
          story: { select: { id: true, title: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      epics: { orderBy: { sortOrder: "asc" } },
      stories: {
        select: { id: true, title: true, epicId: true },
        orderBy: { sortOrder: "asc" },
      },
      milestones: { orderBy: { sortOrder: "asc" } },
      workspace: {
        include: {
          labels: true,
        },
      },
    },
  });
}
