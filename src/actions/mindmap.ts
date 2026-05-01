"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { mindMapSchema, mindMapNodeSchema as nodeSchema } from "@/lib/validators";
import { getCurrentOrgId, userOwnsProject, userOwnsMindMap } from "@/lib/session";
import type { MindMap, MindMapNode } from "@prisma/client";

async function userOwnsNode(nodeId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const node = await db.mindMapNode.findUnique({ where: { id: nodeId }, select: { mindMapId: true } });
  if (!node) return false;
  return userOwnsMindMap(node.mindMapId);
}

export async function createMindMap(input: unknown): Promise<ActionResult<MindMap>> {
  const parsed = mindMapSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("Unauthorized");
  if (parsed.data.projectId && !(await userOwnsProject(parsed.data.projectId))) {
    return failure("프로젝트에 접근 권한이 없습니다");
  }
  try {
    const map = await db.mindMap.create({ data: parsed.data });
    revalidatePath("/mindmaps");
    return success(map);
  } catch (e) {
    console.error(e);
    return failure("Failed to create mind map");
  }
}

export async function deleteMindMap(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsMindMap(id))) return failure("마인드맵에 접근 권한이 없습니다");
  try {
    await db.mindMap.delete({ where: { id } });
    revalidatePath("/mindmaps");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to delete mind map");
  }
}

export async function createNode(input: unknown): Promise<ActionResult<MindMapNode>> {
  const parsed = nodeSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  if (!(await userOwnsMindMap(parsed.data.mindMapId))) return failure("마인드맵에 접근 권한이 없습니다");
  try {
    const node = await db.mindMapNode.create({ data: parsed.data });
    revalidatePath("/mindmaps");
    return success(node);
  } catch (e) {
    console.error(e);
    return failure("Failed to create node");
  }
}

export async function updateNode(id: string, input: unknown): Promise<ActionResult<MindMapNode>> {
  const parsed = nodeSchema.partial().safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "Invalid input");
  if (!(await userOwnsNode(id))) return failure("노드에 접근 권한이 없습니다");
  try {
    const node = await db.mindMapNode.update({ where: { id }, data: parsed.data });
    revalidatePath("/mindmaps");
    return success(node);
  } catch (e) {
    console.error(e);
    return failure("Failed to update node");
  }
}

export async function deleteNode(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsNode(id))) return failure("노드에 접근 권한이 없습니다");
  try {
    await db.mindMapNode.delete({ where: { id } });
    revalidatePath("/mindmaps");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to delete node");
  }
}

export async function convertNodeToEpic(nodeId: string, projectId: string): Promise<ActionResult<void>> {
  if (!(await userOwnsNode(nodeId)) || !(await userOwnsProject(projectId))) return failure("권한이 없습니다");
  try {
    const node = await db.mindMapNode.findUnique({ where: { id: nodeId } });
    if (!node) return failure("Node not found");
    const maxOrder = await db.epic.aggregate({ where: { projectId }, _max: { sortOrder: true } });
    await db.epic.create({
      data: { projectId, name: node.content, status: "todo", priority: "medium", sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
    });
    // NOTE: convertedToTaskId is a FK to Task. We intentionally leave it null for
    // epic conversions. Previous implementation stored the literal string "epic",
    // which would fail FK validation on a proper relational database. The epic is
    // created; tracking which node became which epic requires a schema migration
    // (e.g., add MindMapNode.convertedEpicId / convertedStoryId or a convertedAt
    // + convertedKind pair). Kept minimal for launch.
    revalidatePath("/mindmaps");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to convert node to epic");
  }
}

export async function convertNodeToTask(nodeId: string, projectId: string): Promise<ActionResult<void>> {
  if (!(await userOwnsNode(nodeId)) || !(await userOwnsProject(projectId))) return failure("권한이 없습니다");
  try {
    const node = await db.mindMapNode.findUnique({ where: { id: nodeId } });
    if (!node) return failure("Node not found");

    const task = await db.task.create({
      data: { projectId, title: node.content, status: "todo", priority: "none" },
    });
    await db.mindMapNode.update({
      where: { id: nodeId },
      data: { convertedToTaskId: task.id },
    });
    revalidatePath("/mindmaps");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to convert node to task");
  }
}

export async function convertNodeToStory(nodeId: string, projectId: string): Promise<ActionResult<void>> {
  if (!(await userOwnsNode(nodeId)) || !(await userOwnsProject(projectId))) return failure("권한이 없습니다");
  try {
    const node = await db.mindMapNode.findUnique({ where: { id: nodeId } });
    if (!node) return failure("Node not found");

    const maxOrder = await db.story.aggregate({ where: { projectId }, _max: { sortOrder: true } });
    await db.story.create({
      data: {
        projectId,
        title: node.content,
        status: "backlog",
        priority: "medium",
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    // See note in convertNodeToEpic — literal "story" in a FK field is invalid; skip marker.
    revalidatePath("/mindmaps");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to convert node to story");
  }
}

export async function getMindMapWithNodes(id: string) {
  if (!(await userOwnsMindMap(id))) return null;
  return db.mindMap.findUnique({
    where: { id },
    include: { nodes: { orderBy: { sortOrder: "asc" } }, project: true },
  });
}
