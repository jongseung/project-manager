-- Migration: Add tenant scoping to global tables.
-- Phase 1 (this file): add nullable columns + new indexes. Safe for existing data.
-- Phase 2 (separate migration, run AFTER backfill): set NOT NULL + drop legacy unique constraints.

-- ─── Member ───────────────────────────────────────────────────────────
ALTER TABLE "Member" ADD COLUMN "workspaceId" TEXT;
CREATE INDEX "Member_workspaceId_isActive_idx" ON "Member"("workspaceId", "isActive");
ALTER TABLE "Member"
  ADD CONSTRAINT "Member_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Notification ─────────────────────────────────────────────────────
ALTER TABLE "Notification" ADD COLUMN "organizationId" TEXT;
DROP INDEX IF EXISTS "Notification_recipientId_read_idx";
CREATE INDEX "Notification_organizationId_recipientId_read_idx" ON "Notification"("organizationId", "recipientId", "read");
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── StandupNote ──────────────────────────────────────────────────────
ALTER TABLE "StandupNote" ADD COLUMN "organizationId" TEXT;
-- Drop the old globally-unique date constraint.
DROP INDEX IF EXISTS "StandupNote_date_key";
-- New compound unique per tenant + date.
CREATE UNIQUE INDEX "StandupNote_organizationId_date_key" ON "StandupNote"("organizationId", "date");
CREATE INDEX "StandupNote_date_idx" ON "StandupNote"("date");
ALTER TABLE "StandupNote"
  ADD CONSTRAINT "StandupNote_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── TaskTemplate ─────────────────────────────────────────────────────
ALTER TABLE "TaskTemplate" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "TaskTemplate"
  ADD CONSTRAINT "TaskTemplate_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── DailyPlan ────────────────────────────────────────────────────────
ALTER TABLE "DailyPlan" ADD COLUMN "organizationId" TEXT;
-- Drop the old globally-unique date constraint.
DROP INDEX IF EXISTS "DailyPlan_date_key";
CREATE UNIQUE INDEX "DailyPlan_organizationId_date_key" ON "DailyPlan"("organizationId", "date");
CREATE INDEX "DailyPlan_date_idx" ON "DailyPlan"("date");
ALTER TABLE "DailyPlan"
  ADD CONSTRAINT "DailyPlan_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Workspace index ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Workspace_organizationId_idx" ON "Workspace"("organizationId");
