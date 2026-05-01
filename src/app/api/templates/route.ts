import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const templates = await db.taskTemplate.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, title: true, description: true, priority: true, estimatedHours: true },
  });
  return NextResponse.json(templates);
}
