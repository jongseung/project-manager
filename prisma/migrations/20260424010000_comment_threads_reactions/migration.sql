-- Migration: Comment threading + emoji reactions.

-- ── Comment.parentCommentId ──
ALTER TABLE "Comment" ADD COLUMN "parentCommentId" TEXT;
CREATE INDEX "Comment_parentCommentId_idx" ON "Comment"("parentCommentId");
ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_parentCommentId_fkey"
  FOREIGN KEY ("parentCommentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── CommentReaction table ──
CREATE TABLE "CommentReaction" (
  "id"         TEXT NOT NULL,
  "commentId"  TEXT NOT NULL,
  "emoji"      TEXT NOT NULL,
  "authorName" TEXT NOT NULL DEFAULT 'User',
  "userId"     TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommentReaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CommentReaction_commentId_idx" ON "CommentReaction"("commentId");
CREATE UNIQUE INDEX "CommentReaction_commentId_emoji_userId_key" ON "CommentReaction"("commentId", "emoji", "userId");
CREATE UNIQUE INDEX "CommentReaction_commentId_emoji_authorName_key" ON "CommentReaction"("commentId", "emoji", "authorName");
ALTER TABLE "CommentReaction"
  ADD CONSTRAINT "CommentReaction_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
