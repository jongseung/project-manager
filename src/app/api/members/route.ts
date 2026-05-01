import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiOrg } from "@/lib/session";

// NOTE: Member model is currently global (no workspace/org relation in schema).
// Tenant isolation requires a schema migration (see docs). For now we require
// authentication — this prevents anonymous enumeration but is not yet fully
// tenant-scoped.
export async function GET() {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const members = await db.member.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(members);
}
