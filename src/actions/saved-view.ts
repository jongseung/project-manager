"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { auth } from "@/lib/auth";
import { getCurrentOrgId, userOwnsProject } from "@/lib/session";
import type { SavedView } from "@prisma/client";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createSavedView(input: {
  projectId: string;
  scope: string;
  name: string;
  config: Record<string, unknown>;
  shared?: boolean;
}): Promise<ActionResult<SavedView>> {
  const userId = await currentUserId();
  if (!userId) return failure("인증이 필요합니다");
  if (!(await userOwnsProject(input.projectId))) return failure("프로젝트에 접근 권한이 없습니다");
  if (!input.name.trim()) return failure("이름을 입력해 주세요");
  try {
    const view = await db.savedView.create({
      data: {
        userId,
        projectId: input.projectId,
        scope: input.scope,
        name: input.name.trim(),
        config: JSON.stringify(input.config),
        shared: input.shared ?? false,
      },
    });
    revalidatePath("/projects/[id]", "page");
    return success(view);
  } catch (e) {
    console.error(e);
    return failure("같은 이름의 뷰가 이미 있거나 저장에 실패했습니다");
  }
}

export async function updateSavedView(
  id: string,
  patch: Partial<{ name: string; config: Record<string, unknown>; shared: boolean }>,
): Promise<ActionResult<SavedView>> {
  const userId = await currentUserId();
  if (!userId) return failure("인증이 필요합니다");
  const existing = await db.savedView.findUnique({ where: { id }, select: { userId: true, projectId: true } });
  if (!existing || existing.userId !== userId) return failure("권한이 없습니다");
  try {
    const view = await db.savedView.update({
      where: { id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.config !== undefined ? { config: JSON.stringify(patch.config) } : {}),
        ...(patch.shared !== undefined ? { shared: patch.shared } : {}),
      },
    });
    revalidatePath("/projects/[id]", "page");
    return success(view);
  } catch (e) {
    console.error(e);
    return failure("뷰 수정에 실패했습니다");
  }
}

export async function deleteSavedView(id: string): Promise<ActionResult<void>> {
  const userId = await currentUserId();
  if (!userId) return failure("인증이 필요합니다");
  const existing = await db.savedView.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== userId) return failure("권한이 없습니다");
  try {
    await db.savedView.delete({ where: { id } });
    revalidatePath("/projects/[id]", "page");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("뷰 삭제에 실패했습니다");
  }
}

/**
 * Returns the caller's private views + any shared views from the same org for the given project+scope.
 */
export async function getSavedViews(projectId: string, scope: string) {
  const userId = await currentUserId();
  const orgId = await getCurrentOrgId();
  if (!userId || !orgId) return [];
  if (!(await userOwnsProject(projectId))) return [];

  const views = await db.savedView.findMany({
    where: {
      projectId,
      scope,
      OR: [
        { userId },
        { shared: true, project: { workspace: { organizationId: orgId } } },
      ],
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ shared: "asc" }, { name: "asc" }],
  });

  return views.map((v) => ({
    id: v.id,
    name: v.name,
    scope: v.scope,
    config: v.config,
    shared: v.shared,
    isMine: v.userId === userId,
    authorLabel: v.user?.name ?? v.user?.email ?? "unknown",
    createdAt: v.createdAt,
  }));
}
