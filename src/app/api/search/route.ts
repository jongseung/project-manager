import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiOrg } from "@/lib/session";

export async function GET(request: NextRequest) {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);

  const tasks = await db.task.findMany({
    where: {
      archivedAt: null,
      project: { workspace: { organizationId: ctx.orgId } },
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
    take: 20,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      projectName: t.project.name,
      projectId: t.project.id,
      status: t.status,
      memberName: t.member?.name ?? null,
      labels: t.labels.map((l) => l.label.name),
    }))
  );
}
