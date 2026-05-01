-- Migration: Add soft-delete markers + indexes.
-- Non-null archivedAt = in trash; null = active.

ALTER TABLE "Workspace" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "Workspace_archivedAt_idx" ON "Workspace"("archivedAt");

ALTER TABLE "Project" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "Project_archivedAt_idx" ON "Project"("archivedAt");

ALTER TABLE "Goal" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "Goal_archivedAt_idx" ON "Goal"("archivedAt");
