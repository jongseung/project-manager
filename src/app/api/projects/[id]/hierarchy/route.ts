import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await db.project.findUnique({ where: { id }, select: { workspaceId: true } });
  if (!project) return NextResponse.json({ epics: [], stories: [], labels: [] });

  const [epics, stories, labels] = await Promise.all([
    db.epic.findMany({
      where: { projectId: id },
      select: { id: true, name: true, stories: { select: { id: true, title: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.story.findMany({
      where: { projectId: id },
      select: { id: true, title: true, epicId: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.label.findMany({
      where: { workspace: { projects: { some: { id } } } },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ epics, stories, labels, workspaceId: project.workspaceId });
}
