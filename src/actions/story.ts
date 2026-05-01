"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { storySchema } from "@/lib/validators";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { logActivity } from "./activity";
import { userOwnsProject, userOwnsStory, userOwnsKeyResult } from "@/lib/session";
import type { Story } from "@prisma/client";

export async function createStory(input: unknown): Promise<ActionResult<Story>> {
  const parsed = storySchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  if (!(await userOwnsProject(parsed.data.projectId))) return failure("프로젝트에 접근 권한이 없습니다");

  try {
    const maxOrder = await db.story.aggregate({
      where: { projectId: parsed.data.projectId },
      _max: { sortOrder: true },
    });
    const story = await db.story.create({
      data: { ...parsed.data, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
    });
    await logActivity("story", story.id, "created", { title: story.title });
    revalidatePath("/", "layout");
    return success(story);
  } catch (e) {
    console.error(e);
    return failure("Failed to create story");
  }
}

export async function updateStory(id: string, input: unknown): Promise<ActionResult<Story>> {
  const parsed = storySchema.partial().safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  if (!(await userOwnsStory(id))) return failure("스토리에 접근 권한이 없습니다");

  try {
    const story = await db.story.update({ where: { id }, data: parsed.data });
    revalidatePath("/", "layout");
    return success(story);
  } catch (e) {
    console.error(e);
    return failure("Failed to update story");
  }
}

export async function deleteStory(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsStory(id))) return failure("스토리에 접근 권한이 없습니다");
  try {
    await db.story.update({ where: { id }, data: { archivedAt: new Date() } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to delete story");
  }
}

export async function restoreStory(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsStory(id))) return failure("스토리에 접근 권한이 없습니다");
  try {
    await db.story.update({ where: { id }, data: { archivedAt: null } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to restore story");
  }
}

export async function purgeStory(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsStory(id))) return failure("스토리에 접근 권한이 없습니다");
  try {
    await db.story.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("영구 삭제에 실패했습니다");
  }
}

export async function getProjectStories(projectId: string) {
  if (!(await userOwnsProject(projectId))) return [];
  return db.story.findMany({
    where: { projectId, archivedAt: null },
    include: {
      tasks: { where: { archivedAt: null }, select: { id: true, status: true } },
      krLinks: { include: { keyResult: { include: { objective: true } } } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function linkStoryToKR(storyId: string, keyResultId: string, estimatedImpact?: number): Promise<ActionResult<void>> {
  if (!(await userOwnsStory(storyId)) || !(await userOwnsKeyResult(keyResultId))) {
    return failure("권한이 없습니다");
  }
  try {
    await db.storyKRLink.create({
      data: { storyId, keyResultId, estimatedImpact },
    });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to link story to KR");
  }
}

export async function unlinkStoryFromKR(storyId: string, keyResultId: string): Promise<ActionResult<void>> {
  if (!(await userOwnsStory(storyId))) return failure("권한이 없습니다");
  try {
    await db.storyKRLink.delete({
      where: { storyId_keyResultId: { storyId, keyResultId } },
    });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to unlink story from KR");
  }
}
