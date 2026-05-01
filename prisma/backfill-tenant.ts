/**
 * Tenant backfill script — assigns all legacy global data to a single
 * organization so NOT NULL constraints can be enforced in a follow-up migration.
 *
 * Usage:
 *   # Backfill into the first existing organization:
 *   npx tsx prisma/backfill-tenant.ts
 *
 *   # Backfill into a specific organization:
 *   TENANT_ORG_ID=<orgId> npx tsx prisma/backfill-tenant.ts
 *
 * Safe to re-run — only updates rows where the scoping field is NULL.
 *
 * After this runs successfully, run a second migration that sets the columns
 * NOT NULL:
 *
 *   -- prisma/migrations/<next>_tenant_scoping_not_null/migration.sql
 *   ALTER TABLE "Member"       ALTER COLUMN "workspaceId"    SET NOT NULL;
 *   ALTER TABLE "Notification" ALTER COLUMN "organizationId" SET NOT NULL;
 *   ALTER TABLE "StandupNote"  ALTER COLUMN "organizationId" SET NOT NULL;
 *   ALTER TABLE "TaskTemplate" ALTER COLUMN "organizationId" SET NOT NULL;
 *   ALTER TABLE "DailyPlan"    ALTER COLUMN "organizationId" SET NOT NULL;
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const targetOrgId = process.env.TENANT_ORG_ID ?? (await db.organization.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }))?.id;
  if (!targetOrgId) {
    console.error("No Organization found and TENANT_ORG_ID not set. Aborting.");
    process.exit(1);
  }
  console.log(`Backfilling legacy data into org: ${targetOrgId}`);

  // Pick the first workspace of the target org for Member backfill.
  const targetWs = await db.workspace.findFirst({
    where: { organizationId: targetOrgId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!targetWs) {
    console.error("Target organization has no workspace. Create one first. Aborting.");
    process.exit(1);
  }
  console.log(`Members will be attached to workspace: ${targetWs.id}`);

  // Workspace.organizationId — attach any orphaned workspaces to the target org.
  const ws = await db.workspace.updateMany({
    where: { organizationId: null },
    data: { organizationId: targetOrgId },
  });
  console.log(`Workspace.organizationId backfilled: ${ws.count} rows`);

  // Member.workspaceId
  const members = await db.member.updateMany({
    where: { workspaceId: null },
    data: { workspaceId: targetWs.id },
  });
  console.log(`Member.workspaceId backfilled: ${members.count} rows`);

  // Notification.organizationId
  const notifs = await db.notification.updateMany({
    where: { organizationId: null },
    data: { organizationId: targetOrgId },
  });
  console.log(`Notification.organizationId backfilled: ${notifs.count} rows`);

  // StandupNote.organizationId
  const standups = await db.standupNote.updateMany({
    where: { organizationId: null },
    data: { organizationId: targetOrgId },
  });
  console.log(`StandupNote.organizationId backfilled: ${standups.count} rows`);

  // TaskTemplate.organizationId
  const templates = await db.taskTemplate.updateMany({
    where: { organizationId: null },
    data: { organizationId: targetOrgId },
  });
  console.log(`TaskTemplate.organizationId backfilled: ${templates.count} rows`);

  // DailyPlan.organizationId
  const plans = await db.dailyPlan.updateMany({
    where: { organizationId: null },
    data: { organizationId: targetOrgId },
  });
  console.log(`DailyPlan.organizationId backfilled: ${plans.count} rows`);

  // ActivityLog.organizationId — best-effort, may be nullable intentionally.
  const logs = await db.activityLog.updateMany({
    where: { organizationId: null },
    data: { organizationId: targetOrgId },
  });
  console.log(`ActivityLog.organizationId backfilled: ${logs.count} rows`);

  console.log("\nDone. Verify counts, then run the NOT NULL follow-up migration.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
