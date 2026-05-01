"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { taskTemplateSchema } from "@/lib/validators";
import { getCurrentOrgId, userOwnsProject, userOwnsTask } from "@/lib/session";
import type { TaskTemplate } from "@prisma/client";

// NOTE: TaskTemplate model is currently global (no workspace/org relation).
// Full isolation requires a schema migration. For now we require authentication.
export async function createTemplate(input: unknown): Promise<ActionResult<TaskTemplate>> {
  const parsed = taskTemplateSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");
  try {
    const template = await db.taskTemplate.create({ data: { ...parsed.data, organizationId: orgId } });
    revalidatePath("/", "layout");
    return success(template);
  } catch (e) {
    console.error(e);
    return failure("템플릿 생성에 실패했습니다");
  }
}

export async function deleteTemplate(id: string): Promise<ActionResult<void>> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");
  try {
    // Scope delete: only allow deleting templates owned by caller's org.
    const { count } = await db.taskTemplate.deleteMany({ where: { id, organizationId: orgId } });
    if (count === 0) return failure("템플릿을 찾을 수 없습니다");
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("템플릿 삭제에 실패했습니다");
  }
}

export async function getTemplates() {
  const orgId = await getCurrentOrgId();
  if (!orgId) return [];
  return db.taskTemplate.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } });
}

export async function applyTemplate(
  templateId: string,
  projectId: string
): Promise<ActionResult<void>> {
  if (!(await userOwnsProject(projectId))) return failure("프로젝트에 접근 권한이 없습니다");
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");
  try {
    const template = await db.taskTemplate.findFirst({ where: { id: templateId, organizationId: orgId } });
    if (!template) return failure("Template not found");

    await db.task.create({
      data: {
        projectId,
        title: template.title,
        description: template.description,
        priority: template.priority,
        estimatedHours: template.estimatedHours,
        status: "todo",
        templateName: template.name,
      },
    });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("템플릿 적용에 실패했습니다");
  }
}

export async function saveTaskAsTemplate(
  taskId: string,
  templateName: string
): Promise<ActionResult<TaskTemplate>> {
  if (!(await userOwnsTask(taskId))) return failure("태스크에 접근 권한이 없습니다");
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");
  try {
    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task) return failure("태스크를 찾을 수 없습니다");

    const template = await db.taskTemplate.create({
      data: {
        organizationId: orgId,
        name: templateName,
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
      },
    });
    revalidatePath("/", "layout");
    return success(template);
  } catch (e) {
    console.error(e);
    return failure("템플릿 저장에 실패했습니다");
  }
}
