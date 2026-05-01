import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const logs = await db.activityLog.findMany({
    where: { entityType: "task", entityId: id },
    orderBy: { occurredAt: "desc" },
    take: 20,
    select: { id: true, action: true, details: true, occurredAt: true },
  });
  return NextResponse.json(logs);
}
