"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { labelSchema } from "@/lib/validators";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { userOwnsWorkspace, userOwnsLabel, userOwnsTask } from "@/lib/session";
import type { Label } from "@prisma/client";

export async function createLabel(input: unknown): Promise<ActionResult<Label>> {
  const parsed = labelSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  if (!(await userOwnsWorkspace(parsed.data.workspaceId))) return failure("워크스페이스에 접근 권한이 없습니다");
  try {
    const label = await db.label.create({ data: parsed.data });
    revalidatePath("/", "layout");
    return success(label);
  } catch (e) {
    console.error(e);
    return failure("Failed to create label");
  }
}

export async function deleteLabel(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsLabel(id))) return failure("라벨에 접근 권한이 없습니다");
  try {
    await db.label.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to delete label");
  }
}

export async function assignLabel(taskId: string, labelId: string): Promise<ActionResult<void>> {
  if (!(await userOwnsTask(taskId)) || !(await userOwnsLabel(labelId))) return failure("권한이 없습니다");
  try {
    await db.taskLabel.create({ data: { taskId, labelId } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to assign label");
  }
}

export async function removeLabel(taskId: string, labelId: string): Promise<ActionResult<void>> {
  if (!(await userOwnsTask(taskId))) return failure("권한이 없습니다");
  try {
    await db.taskLabel.delete({ where: { taskId_labelId: { taskId, labelId } } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to remove label");
  }
}

export async function getLabels(workspaceId: string) {
  if (!(await userOwnsWorkspace(workspaceId))) return [];
  return db.label.findMany({ where: { workspaceId }, orderBy: { name: "asc" } });
}
