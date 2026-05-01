"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { dependencySchema } from "@/lib/validators";
import { userOwnsTask } from "@/lib/session";
import type { Dependency } from "@prisma/client";

async function detectCycle(predecessorId: string, successorId: string): Promise<boolean> {
  // Single query: fetch ALL dependencies, then BFS in-memory
  const allDeps = await db.dependency.findMany({
    select: { predecessorTaskId: true, successorTaskId: true },
  });

  const graph = new Map<string, string[]>();
  allDeps.forEach((d) => {
    if (!graph.has(d.predecessorTaskId)) graph.set(d.predecessorTaskId, []);
    graph.get(d.predecessorTaskId)!.push(d.successorTaskId);
  });

  const visited = new Set<string>();
  const queue = [successorId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === predecessorId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const successors = graph.get(current) ?? [];
    queue.push(...successors);
  }
  return false;
}

export async function createDependency(input: unknown): Promise<ActionResult<Dependency>> {
  const parsed = dependencySchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");

  if (parsed.data.predecessorTaskId === parsed.data.successorTaskId) {
    return failure("태스크는 자기 자신에게 의존할 수 없습니다");
  }

  const hasCycle = await detectCycle(parsed.data.predecessorTaskId, parsed.data.successorTaskId);
  if (hasCycle) return failure("순환 참조가 발생합니다");

  try {
    const dep = await db.dependency.create({ data: parsed.data });
    revalidatePath("/", "layout");
    return success(dep);
  } catch (e) {
    console.error(e);
    return failure("의존성이 이미 존재하거나 생성에 실패했습니다");
  }
}

export async function deleteDependency(id: string): Promise<ActionResult<void>> {
  try {
    const dep = await db.dependency.findUnique({ where: { id } });
    if (!dep) return failure("의존성을 찾을 수 없습니다");
    if (!(await userOwnsTask(dep.predecessorTaskId))) {
      return failure("권한이 없습니다");
    }
    await db.dependency.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("의존성 삭제에 실패했습니다");
  }
}
