-- Migration: Saved views (filter/sort presets) per user × project × scope.

CREATE TABLE "SavedView" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "scope"     TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "config"    TEXT NOT NULL,
  "shared"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedView_userId_projectId_scope_name_key"
  ON "SavedView"("userId", "projectId", "scope", "name");
CREATE INDEX "SavedView_projectId_scope_idx" ON "SavedView"("projectId", "scope");

ALTER TABLE "SavedView"
  ADD CONSTRAINT "SavedView_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedView"
  ADD CONSTRAINT "SavedView_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
