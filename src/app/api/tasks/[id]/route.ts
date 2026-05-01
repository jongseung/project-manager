import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiOrg } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
  const task = await db.task.findFirst({
    where: { id, project: { workspace: { organizationId: ctx.orgId } } },
    include: {
      subtasks: { orderBy: { sortOrder: "asc" } },
      member: { select: { id: true, name: true, color: true } },
      labels: { include: { label: true } },
      comments: {
        include: { reactions: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      epic: { select: { id: true, name: true } },
      story: { select: { id: true, title: true } },
      predecessorDeps: { include: { predecessorTask: { select: { id: true, title: true, status: true } } } },
      successorDeps: { include: { successorTask: { select: { id: true, title: true, status: true } } } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!task) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(task);
}
