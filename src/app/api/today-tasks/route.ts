import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { format, addDays } from "date-fns";
import { requireApiOrg } from "@/lib/session";

export async function GET() {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const today = format(new Date(), "yyyy-MM-dd");
  const threeDays = format(addDays(new Date(), 3), "yyyy-MM-dd");
  const orgScope = { project: { workspace: { organizationId: ctx.orgId } } };

  const [overdue, dueToday, upcoming, inProgress, doneToday] = await Promise.all([
    db.task.findMany({
      where: { ...orgScope, dueDate: { lt: today }, status: { notIn: ["done", "cancelled"] }, archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    db.task.findMany({
      where: { ...orgScope, dueDate: today, status: { notIn: ["done", "cancelled"] }, archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } } },
      orderBy: [{ priority: "asc" }, { sortOrder: "asc" }],
    }),
    db.task.findMany({
      where: { ...orgScope, dueDate: { gt: today, lte: threeDays }, status: { notIn: ["done", "cancelled"] }, archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    db.task.findMany({
      where: { ...orgScope, status: "in_progress", dueDate: { not: today }, archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.task.findMany({
      where: { ...orgScope, status: "done", completedAt: { gte: new Date(today + "T00:00:00") }, parentTaskId: null },
      include: { project: { select: { name: true, color: true } } },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
  ]);

  function mapTask(t: typeof overdue[number]) {
    return { id: t.id, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate, projectName: t.project.name, projectColor: t.project.color };
  }

  return NextResponse.json({
    overdue: overdue.map(mapTask),
    dueToday: dueToday.map(mapTask),
    upcoming: upcoming.map(mapTask),
    inProgress: inProgress.map(mapTask),
    doneToday: doneToday.map(mapTask),
  });
}
