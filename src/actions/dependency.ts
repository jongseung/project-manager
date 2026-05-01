"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { dependencySchema } from "@/lib/validators";
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
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "Invalid input");

  if (parsed.data.predecessorTaskId === parsed.data.successorTaskId) {
    return failure("A task cannot depend on itself");
  }

  const hasCycle = await detectCycle(parsed.data.predecessorTaskId, parsed.data.successorTaskId);
  if (hasCycle) return failure("This dependency would create a circular reference");

  try {
    const dep = await db.dependency.create({ data: parsed.data });
    revalidatePath("/", "layout");
    return success(dep);
  } catch (e) {
    console.error(e);
    return failure("Dependency already exists or failed to create");
  }
}

export async function deleteDependency(id: string): Promise<ActionResult<void>> {
  try {
    await db.dependency.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("Failed to delete dependency");
  }
}
