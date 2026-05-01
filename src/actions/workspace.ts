"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { workspaceSchema } from "@/lib/validators";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { getCurrentOrgId, userOwnsWorkspace } from "@/lib/session";
import type { Workspace } from "@prisma/client";

export async function createWorkspace(
  input: unknown
): Promise<ActionResult<Workspace>> {
  const parsed = workspaceSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("조직을 먼저 생성해 주세요");

  try {
    const workspace = await db.workspace.create({
      data: { ...parsed.data, organizationId: orgId },
    });
    revalidatePath("/", "layout");
    return success(workspace);
  } catch (e) {
    console.error(e);
    return failure("Failed to create workspace");
  }
}

export async function updateWorkspace(
  id: string,
  input: unknown
): Promise<ActionResult<Workspace>> {
  const parsed = workspaceSchema.partial().safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  if (!(await userOwnsWorkspace(id))) {
    return failure("워크스페이스에 접근 권한이 없습니다");
  }

  try {
    const workspace = await db.workspace.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/", "layout");
    return success(workspace);
  } catch (e) {
    console.error(e);
    return failure("Failed to update workspace");
  }
}

/**
 * Soft-delete: moves the workspace to trash (archivedAt = now).
 * Use purgeWorkspace() to permanently delete.
 */
export async function deleteWorkspace(
  id: string
): Promise<ActionResult<void>> {
  if (!(await userOwnsWorkspace(id))) {
    return failure("워크스페이스에 접근 권한이 없습니다");
  }
  try {
    await db.workspace.update({ where: { id }, data: { archivedAt: new Date() } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to delete workspace");
  }
}

export async function restoreWorkspace(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsWorkspace(id))) return failure("워크스페이스에 접근 권한이 없습니다");
  try {
    await db.workspace.update({ where: { id }, data: { archivedAt: null } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to restore workspace");
  }
}

export async function purgeWorkspace(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsWorkspace(id))) return failure("워크스페이스에 접근 권한이 없습니다");
  try {
    await db.workspace.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("영구 삭제에 실패했습니다");
  }
}

export async function getWorkspaces() {
  const orgId = await getCurrentOrgId();
  if (!orgId) return [];
  return db.workspace.findMany({
    where: { organizationId: orgId, archivedAt: null },
    include: {
      projects: {
        where: { status: { not: "archived" }, archivedAt: null },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}
