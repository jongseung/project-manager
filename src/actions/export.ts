"use server";

import { db } from "@/lib/db";
import { getCurrentOrgId } from "@/lib/session";

export async function exportData() {
  const orgId = await getCurrentOrgId();
  if (!orgId) return { exportedAt: new Date().toISOString(), version: "1.0", data: {} };

  const orgFilter = { workspace: { organizationId: orgId } };

  const [workspaces, projects, epics, tasks, labels, goals, kpis, milestones, sprints, members, mindMaps, dailyPlans, standupNotes] = await Promise.all([
    db.workspace.findMany({ where: { organizationId: orgId } }),
    db.project.findMany({ where: orgFilter }),
    db.epic.findMany({ where: { project: orgFilter } }),
    db.task.findMany({ where: { project: orgFilter } }),
    db.label.findMany({ where: { workspace: { organizationId: orgId } } }),
    db.goal.findMany({ where: { workspace: { organizationId: orgId } } }),
    db.kPI.findMany({ where: { OR: [{ project: orgFilter }, { goal: { workspace: { organizationId: orgId } } }] }, include: { entries: true } }),
    db.milestone.findMany({ where: { project: orgFilter } }),
    db.sprint.findMany({ where: { project: orgFilter }, include: { tasks: true } }),
    db.member.findMany({ where: { workspace: { organizationId: orgId } } }),
    db.mindMap.findMany({ where: { OR: [{ project: orgFilter }, { projectId: null }] }, include: { nodes: true } }),
    db.dailyPlan.findMany({ where: { organizationId: orgId }, include: { tasks: true } }),
    db.standupNote.findMany({ where: { organizationId: orgId } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    data: { workspaces, projects, epics, tasks, labels, goals, kpis, milestones, sprints, members, mindMaps, dailyPlans, standupNotes },
  };
}

export async function exportCSV() {
  const orgId = await getCurrentOrgId();
  if (!orgId) return "";

  const tasks = await db.task.findMany({
    where: { project: { workspace: { organizationId: orgId } } },
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
