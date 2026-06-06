"use server";

import { db } from "@/lib/db";
import { userOwnsProject } from "@/lib/session";
import { format, subDays, startOfWeek } from "date-fns";

export interface FlowSignalTask {
  id: string;
  title: string;
  status: string;
  reason: string;
}

export interface EpicLane {
  id: string;
  name: string;
  status: string;
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  review: number;
  atRisk: number;
  progress: number;
}

export interface ProjectFlow {
  stages: { status: string; count: number; wipLimit?: number; over: boolean }[];
  signals: {
    overdue: FlowSignalTask[];
    blocked: FlowSignalTask[];
    stale: FlowSignalTask[];
    unassigned: number;
  };
  throughput: {
    thisWeekDone: number;
    thisWeekCreated: number;
    lastWeekDone: number;
    net: number; // done - created this week
  };
  epics: EpicLane[];
  bottleneck: string | null;
}

const PIPELINE = ["backlog", "todo", "in_progress", "in_review", "done"] as const;
const WIP: Record<string, number> = { in_progress: 5, in_review: 3 };
const STALE_DAYS = 7;

export async function getProjectFlow(projectId: string): Promise<ProjectFlow | null> {
  if (!(await userOwnsProject(projectId))) return null;

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const staleCutoff = subDays(today, STALE_DAYS);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = subDays(weekStart, 7);

  const [topTasks, allStatuses, epics, deps] = await Promise.all([
    db.task.findMany({
      where: { projectId, parentTaskId: null, archivedAt: null },
      select: { id: true, title: true, status: true, priority: true, dueDate: true, updatedAt: true, completedAt: true, createdAt: true, memberId: true, epicId: true },
    }),
    db.task.findMany({ where: { projectId, archivedAt: null }, select: { id: true, status: true } }),
    db.epic.findMany({ where: { projectId, archivedAt: null }, select: { id: true, name: true, status: true }, orderBy: { sortOrder: "asc" } }),
    db.dependency.findMany({ where: { successorTask: { projectId } }, select: { predecessorTaskId: true, successorTaskId: true } }),
  ]);

  const statusOf = new Map(allStatuses.map((t) => [t.id, t.status]));
  const predecessors = new Map<string, string[]>();
  for (const d of deps) {
    const arr = predecessors.get(d.successorTaskId) ?? [];
    arr.push(d.predecessorTaskId);
    predecessors.set(d.successorTaskId, arr);
  }

  const isClosed = (s: string) => s === "done" || s === "cancelled";

  // stages
  const stages = PIPELINE.map((status) => {
    const count = topTasks.filter((t) => t.status === status).length;
    const wipLimit = WIP[status];
    return { status, count, wipLimit, over: wipLimit !== undefined && count > wipLimit };
  });

  // signals
  const overdue: FlowSignalTask[] = [];
  const blocked: FlowSignalTask[] = [];
  const stale: FlowSignalTask[] = [];
  let unassigned = 0;

  for (const t of topTasks) {
    if (isClosed(t.status)) continue;
    if (t.dueDate && t.dueDate < todayStr) overdue.push({ id: t.id, title: t.title, status: t.status, reason: `마감 ${t.dueDate}` });
    const preds = predecessors.get(t.id) ?? [];
    const blocking = preds.filter((p) => { const s = statusOf.get(p); return s && !isClosed(s); });
    if (blocking.length > 0) blocked.push({ id: t.id, title: t.title, status: t.status, reason: `선행 ${blocking.length}건 미완` });
    if (t.status === "in_progress" && t.updatedAt < staleCutoff) stale.push({ id: t.id, title: t.title, status: t.status, reason: `${STALE_DAYS}일+ 정체` });
    if (!t.memberId) unassigned++;
  }

  // throughput
  const thisWeekDone = topTasks.filter((t) => t.completedAt && t.completedAt >= weekStart).length;
  const thisWeekCreated = topTasks.filter((t) => t.createdAt >= weekStart).length;
  const lastWeekDone = topTasks.filter((t) => t.completedAt && t.completedAt >= lastWeekStart && t.completedAt < weekStart).length;

  // epic lanes
  const overdueIds = new Set(overdue.map((t) => t.id));
  const blockedIds = new Set(blocked.map((t) => t.id));
  const epicLanes: EpicLane[] = epics.map((e) => {
    const ts = topTasks.filter((t) => t.epicId === e.id);
    const done = ts.filter((t) => t.status === "done").length;
    const inProgress = ts.filter((t) => t.status === "in_progress").length;
    const review = ts.filter((t) => t.status === "in_review").length;
    const todo = ts.filter((t) => t.status === "todo" || t.status === "backlog").length;
    const atRisk = ts.filter((t) => overdueIds.has(t.id) || blockedIds.has(t.id)).length;
    return {
      id: e.id, name: e.name, status: e.status,
      total: ts.length, done, inProgress, review, todo, atRisk,
      progress: ts.length > 0 ? Math.round((done / ts.length) * 100) : 0,
    };
  });

  // bottleneck = first over-WIP stage, else stage with most non-closed work besides backlog
  const overStage = stages.find((s) => s.over);
  const bottleneck = overStage
    ? overStage.status
    : (() => {
        const mid = stages.filter((s) => s.status === "in_progress" || s.status === "in_review");
        const max = mid.sort((a, b) => b.count - a.count)[0];
        return max && max.count > 0 ? max.status : null;
      })();

  return {
    stages,
    signals: {
      overdue: overdue.slice(0, 6),
      blocked: blocked.slice(0, 6),
      stale: stale.slice(0, 6),
      unassigned,
    },
    throughput: { thisWeekDone, thisWeekCreated, lastWeekDone, net: thisWeekDone - thisWeekCreated },
    epics: epicLanes,
    bottleneck,
  };
}
