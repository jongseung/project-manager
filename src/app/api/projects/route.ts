import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiOrg } from "@/lib/session";

export async function GET() {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const projects = await db.project.findMany({
    where: {
      status: "active",
      archivedAt: null,
      workspace: { organizationId: ctx.orgId },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(projects);
}
