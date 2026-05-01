import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subHours } from "date-fns";
import { requireApiOrg } from "@/lib/session";

const MAX_NOTIFICATIONS = 20;

export async function GET() {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const recent = await db.activityLog.findMany({
    where: {
      occurredAt: { gte: subHours(new Date(), 24) },
      entityId: { notIn: ["seed", "showcase", "workflow-sim"] },
      organizationId: ctx.orgId,
    },
    orderBy: { occurredAt: "desc" },
    take: MAX_NOTIFICATIONS,
  });

  return NextResponse.json(recent);
}
