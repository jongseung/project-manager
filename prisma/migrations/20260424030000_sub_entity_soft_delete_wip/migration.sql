-- Migration: T53 soft-delete for Epic/Story/Sprint/Milestone + T10 WIP limits on BoardView.

ALTER TABLE "Epic"      ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Story"     ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Sprint"    ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Milestone" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Epic_archivedAt_idx"      ON "Epic"("archivedAt");
CREATE INDEX "Story_archivedAt_idx"     ON "Story"("archivedAt");
CREATE INDEX "Sprint_archivedAt_idx"    ON "Sprint"("archivedAt");
CREATE INDEX "Milestone_archivedAt_idx" ON "Milestone"("archivedAt");

ALTER TABLE "BoardView" ADD COLUMN "wipLimits" TEXT NOT NULL DEFAULT '{}';
