import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiOrg } from "@/lib/session";

export async function GET() {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const workspaces = await db.workspace.findMany({
    where: { organizationId: ctx.orgId, archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(workspaces);
}
