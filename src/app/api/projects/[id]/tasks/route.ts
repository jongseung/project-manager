import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tasks = await db.task.findMany({
    where: { projectId: id, parentTaskId: null },
    select: { id: true, title: true, status: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(tasks);
}
