import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiOrg } from "@/lib/session";

export async function GET(request: NextRequest) {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);

  const orgScope = { workspace: { organizationId: ctx.orgId } };

  const [tasks, projects, epics] = await Promise.all([
    db.task.findMany({
      where: {
        archivedAt: null,
        project: orgScope,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        project: { select: { id: true, name: true } },
        member: { select: { name: true } },
        labels: { include: { label: { select: { name: true } } } },
      },
      take: 15,
      orderBy: { updatedAt: "desc" },
    }),
    db.project.findMany({
      where: {
        archivedAt: null,
        ...orgScope,
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, status: true, color: true },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    db.epic.findMany({
      where: {
        archivedAt: null,
        project: orgScope,
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, status: true, project: { select: { id: true, name: true } } },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      projectName: t.project.name,
      projectId: t.project.id,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      memberName: t.member?.name ?? null,
      labels: t.labels.map((l) => l.label.name),
    })),
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      color: p.color,
    })),
    epics: epics.map((e) => ({
      id: e.id,
      name: e.name,
      status: e.status,
      projectId: e.project.id,
      projectName: e.project.name,
    })),
  });
}
