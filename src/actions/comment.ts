"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { commentSchema } from "@/lib/validators";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { userOwnsTask, userOwnsWorkspace } from "@/lib/session";
import type { Comment } from "@prisma/client";

export async function createComment(input: unknown): Promise<ActionResult<Comment>> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");

  // Ownership: must own either the target task OR the workspace-level comment thread
  if (parsed.data.taskId) {
    if (!(await userOwnsTask(parsed.data.taskId))) return failure("태스크에 접근 권한이 없습니다");
  } else if (parsed.data.workspaceId) {
    if (!(await userOwnsWorkspace(parsed.data.workspaceId))) return failure("워크스페이스에 접근 권한이 없습니다");
  } else {
    return failure("taskId 또는 workspaceId가 필요합니다");
  }

  try {
    const comment = await db.comment.create({ data: parsed.data });

    if (parsed.data.mentions && parsed.data.taskId) {
      try {
        const mentionedIds: string[] = JSON.parse(parsed.data.mentions);
        if (mentionedIds.length > 0) {
          const task = await db.task.findUnique({
            where: { id: parsed.data.taskId },
            select: { id: true, title: true, projectId: true },
          });
          if (task) {
            const authorName = parsed.data.authorName ?? "User";
            // Resolve org from task → project → workspace for notification scoping
            const proj = await db.project.findUnique({
              where: { id: task.projectId },
              select: { workspace: { select: { organizationId: true } } },
            });
            const orgId = proj?.workspace?.organizationId ?? null;
            await db.notification.createMany({
              data: mentionedIds.map((memberId) => ({
                organizationId: orgId,
                recipientId: memberId,
                type: "mention",
                title: `${authorName}님이 멘션했습니다`,
                message: task.title,
                link: `/projects/${task.projectId}?task=${task.id}`,
              })),
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    revalidatePath("/", "layout");
    return success(comment);
  } catch (e) {
    console.error(e);
    return failure("댓글 생성에 실패했습니다");
  }
}

export async function deleteComment(id: string): Promise<ActionResult<void>> {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const comment = await db.comment.findUnique({
    where: { id },
    select: { taskId: true, workspaceId: true, userId: true },
  });
  if (!comment) return failure("댓글을 찾을 수 없습니다");

  // Tenant ownership
  if (comment.taskId && !(await userOwnsTask(comment.taskId))) return failure("권한이 없습니다");
  if (!comment.taskId && comment.workspaceId && !(await userOwnsWorkspace(comment.workspaceId))) {
    return failure("권한이 없습니다");
  }
  // Author check — only the comment's author (or legacy unowned comments) can delete.
  if (comment.userId && comment.userId !== userId) {
    return failure("본인이 작성한 댓글만 삭제할 수 있습니다");
  }

  try {
    await db.comment.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("댓글 삭제에 실패했습니다");
  }
}

/**
 * Edit own comment content. Author-only.
 */
export async function updateComment(
  id: string,
  content: string,
): Promise<ActionResult<void>> {
  if (!content.trim()) return failure("내용을 입력해 주세요");
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const comment = await db.comment.findUnique({
    where: { id },
    select: { taskId: true, workspaceId: true, userId: true },
  });
  if (!comment) return failure("댓글을 찾을 수 없습니다");

  if (comment.taskId && !(await userOwnsTask(comment.taskId))) return failure("권한이 없습니다");
  if (!comment.taskId && comment.workspaceId && !(await userOwnsWorkspace(comment.workspaceId))) {
    return failure("권한이 없습니다");
  }
  if (comment.userId && comment.userId !== userId) {
    return failure("본인이 작성한 댓글만 편집할 수 있습니다");
  }

  try {
    await db.comment.update({ where: { id }, data: { content } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("편집 실패");
  }
}

export async function getTaskComments(taskId: string) {
  if (!(await userOwnsTask(taskId))) return [];
  return db.comment.findMany({
    where: { taskId },
    include: { reactions: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Toggle an emoji reaction on a comment for the caller.
 * If a reaction with the same (commentId, emoji, authorName) exists, it's removed.
 * Otherwise created.
 */
export async function toggleCommentReaction(
  commentId: string,
  emoji: string,
  authorName: string = "User",
): Promise<ActionResult<{ added: boolean }>> {
  // Scope: must own the comment's parent task (if task comment) or workspace
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { taskId: true, workspaceId: true },
  });
  if (!comment) return failure("댓글을 찾을 수 없습니다");
  if (comment.taskId && !(await userOwnsTask(comment.taskId))) return failure("권한이 없습니다");
  if (!comment.taskId && comment.workspaceId && !(await userOwnsWorkspace(comment.workspaceId))) {
    return failure("권한이 없습니다");
  }

  try {
    const existing = await db.commentReaction.findFirst({
      where: { commentId, emoji, authorName },
      select: { id: true },
    });
    if (existing) {
      await db.commentReaction.delete({ where: { id: existing.id } });
      revalidatePath("/", "layout");
      return success({ added: false });
    }
    await db.commentReaction.create({ data: { commentId, emoji, authorName } });
    revalidatePath("/", "layout");
    return success({ added: true });
  } catch (e) {
    console.error(e);
    return failure("반응 토글 실패");
  }
}
