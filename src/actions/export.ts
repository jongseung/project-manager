"use server";

import { db } from "@/lib/db";

export async function exportData() {
  const [workspaces, projects, epics, tasks, labels, goals, kpis, milestones, sprints, members, mindMaps, dailyPlans, standupNotes] = await Promise.all([
    db.workspace.findMany(),
    db.project.findMany(),
    db.epic.findMany(),
    db.task.findMany(),
    db.label.findMany(),
    db.goal.findMany(),
    db.kPI.findMany({ include: { entries: true } }),
    db.milestone.findMany(),
    db.sprint.findMany({ include: { tasks: true } }),
    db.member.findMany(),
    db.mindMap.findMany({ include: { nodes: true } }),
    db.dailyPlan.findMany({ include: { tasks: true } }),
    db.standupNote.findMany(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    data: { workspaces, projects, epics, tasks, labels, goals, kpis, milestones, sprints, members, mindMaps, dailyPlans, standupNotes },
  };
}

export async function exportCSV() {
  const tasks = await db.task.findMany({
    include: { project: { select: { name: true } }, member: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["Title", "Status", "Priority", "Project", "Assignee", "Due Date", "Created"];
  const rows = tasks.map((t) => [
    `"${t.title.replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    `"${t.project.name}"`,
    t.member?.name ?? "",
    t.dueDate ?? "",
    t.createdAt.toISOString().split("T")[0],
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
