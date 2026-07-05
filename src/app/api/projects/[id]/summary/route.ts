import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { format } from "date-fns";

/** Lightweight project status snapshot for the always-visible header strip. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const tasks = await db.task.findMany({
    where: { projectId: id, archivedAt: null, parentTaskId: null },
    select: { status: true, dueDate: true },
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const summary = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    inReview: tasks.filter((t) => t.status === "in_review").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    todo: tasks.filter((t) => t.status === "todo" || t.status === "backlog").length,
    overdue: tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== "done" && t.status !== "cancelled").length,
  };

  return NextResponse.json(summary);
}
