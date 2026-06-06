"use server";

import { db } from "@/lib/db";
import { userOwnsProject } from "@/lib/session";

export type GraphNodeType = "task" | "epic" | "story";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  status: string;
  priority?: string;
  memberColor?: string | null;
}

export type GraphEdgeKind = "dependency" | "epic" | "story" | "subtask";

export interface GraphEdge {
  source: string;
  target: string;
  kind: GraphEdgeKind;
}

export interface ProjectGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Builds an Obsidian-style connection graph for a project:
 * nodes are tasks / epics / stories, edges are dependencies, epic & story
 * membership, and parent→subtask links. Everything links to everything it
 * relates to, so a manager can see how the whole project hangs together.
 */
export async function getProjectGraph(projectId: string): Promise<ProjectGraph | null> {
  if (!(await userOwnsProject(projectId))) return null;

  const [tasks, epics, stories, deps] = await Promise.all([
    db.task.findMany({
      where: { projectId, archivedAt: null },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        epicId: true,
        storyId: true,
        parentTaskId: true,
        member: { select: { color: true } },
      },
    }),
    db.epic.findMany({
      where: { projectId, archivedAt: null },
      select: { id: true, name: true, status: true },
    }),
    db.story.findMany({
      where: { projectId, archivedAt: null },
      select: { id: true, title: true, status: true },
    }),
    db.dependency.findMany({
      where: { predecessorTask: { projectId } },
      select: { predecessorTaskId: true, successorTaskId: true },
    }),
  ]);

  const taskIds = new Set(tasks.map((t) => t.id));
  const epicIds = new Set(epics.map((e) => e.id));
  const storyIds = new Set(stories.map((s) => s.id));

  const nodes: GraphNode[] = [
    ...epics.map((e) => ({ id: e.id, type: "epic" as const, label: e.name, status: e.status })),
    ...stories.map((s) => ({ id: s.id, type: "story" as const, label: s.title, status: s.status })),
    ...tasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      label: t.title,
      status: t.status,
      priority: t.priority,
      memberColor: t.member?.color ?? null,
    })),
  ];

  const edges: GraphEdge[] = [];
  for (const t of tasks) {
    if (t.epicId && epicIds.has(t.epicId)) edges.push({ source: t.epicId, target: t.id, kind: "epic" });
    if (t.storyId && storyIds.has(t.storyId)) edges.push({ source: t.storyId, target: t.id, kind: "story" });
    if (t.parentTaskId && taskIds.has(t.parentTaskId)) edges.push({ source: t.parentTaskId, target: t.id, kind: "subtask" });
  }
  for (const d of deps) {
    if (taskIds.has(d.predecessorTaskId) && taskIds.has(d.successorTaskId)) {
      edges.push({ source: d.predecessorTaskId, target: d.successorTaskId, kind: "dependency" });
    }
  }

  return { nodes, edges };
}
