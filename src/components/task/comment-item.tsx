"use client";

import { useState, useMemo, useTransition, useRef } from "react";
import dynamic from "next/dynamic";
import { SmilePlus, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toggleCommentReaction, createComment } from "@/actions/comment";
import { formatRelativeDate, cn } from "@/lib/utils";
import { toast } from "sonner";

const CommentEditor = dynamic(
  () => import("@/components/editor/comment-editor").then((m) => ({ default: m.CommentEditor })),
  { ssr: false },
);
import type { CommentEditorRef } from "@/components/editor/comment-editor";

/** A single reaction record from the server. */
export type Reaction = {
  id: string;
  emoji: string;
  authorName: string;
};

export type ThreadComment = {
  id: string;
  content: string;
  authorName: string;
  createdAt: string | Date;
  parentCommentId: string | null;
  reactions: Reaction[];
};

interface CommentItemProps {
  comment: ThreadComment;
  replies?: ThreadComment[];
  members?: { id: string; name: string; color: string }[];
  taskId: string;
  /** Current user's display name — used to detect their own reactions. */
  currentAuthor?: string;
  /** Called after any change to request a refetch of the comments list. */
  onChanged: () => void;
  depth?: number;
}

const QUICK_EMOJIS = ["👍", "❤️", "🎉", "🙏", "🚀", "👀", "🔥", "✅"];

export function CommentItem({
  comment,
  replies = [],
  members = [],
  taskId,
  currentAuthor = "User",
  onChanged,
  depth = 0,
}: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const replyEditorApi = useRef<CommentEditorRef | null>(null);

  // Aggregate reactions by emoji.
  const reactionGroups = useMemo(() => {
    const map = new Map<string, { count: number; mine: boolean; authors: string[] }>();
    for (const r of comment.reactions) {
      const current = map.get(r.emoji) ?? { count: 0, mine: false, authors: [] };
      current.count += 1;
      current.authors.push(r.authorName);
      if (r.authorName === currentAuthor) current.mine = true;
      map.set(r.emoji, current);
    }
    return map;
  }, [comment.reactions, currentAuthor]);

  function toggle(emoji: string) {
    startTransition(async () => {
      const res = await toggleCommentReaction(comment.id, emoji, currentAuthor);
      if (!res.success) toast.error(res.error ?? "반응 실패");
      else onChanged();
    });
  }

  async function submitReply() {
    const api = replyEditorApi.current;
    if (!api || api.isEmpty()) return;
    const content = JSON.stringify(api.getJSON());
    const mentioned = api.getMentionedUserIds();
    const res = await createComment({
      taskId,
      parentCommentId: comment.id,
      content,
      authorName: currentAuthor,
      mentions: mentioned.length > 0 ? JSON.stringify(mentioned) : undefined,
    });
    if (res.success) {
      api.clear();
      setReplyOpen(false);
      onChanged();
    } else {
      toast.error(res.error ?? "답글 실패");
    }
  }

  return (
    <div className={cn("space-y-2", depth > 0 && "pl-4 border-l-2 border-muted")}>
      <div className="rounded-lg bg-muted/40 px-3 py-2">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-semibold">{comment.authorName}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeDate(new Date(comment.createdAt))}
          </span>
        </div>

        <CommentEditor initialContent={comment.content} readOnly />

        {/* Reactions row */}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {[...reactionGroups.entries()].map(([emoji, g]) => (
            <button
              key={emoji}
              type="button"
              title={g.authors.join(", ")}
              onClick={() => toggle(emoji)}
              disabled={isPending}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                g.mine
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-background hover:bg-accent border-border text-foreground",
              )}
            >
              <span>{emoji}</span>
              <span className="tabular-nums">{g.count}</span>
            </button>
          ))}

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent"
                aria-label="반응 추가"
              >
                <SmilePlus className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1" align="start">
              <div className="flex gap-0.5">
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => toggle(e)}
                    className="rounded hover:bg-accent px-1.5 py-1 text-base"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {depth < 2 && (
            <button
              type="button"
              onClick={() => setReplyOpen((v) => !v)}
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-accent"
            >
              <MessageSquare className="h-3 w-3 mr-0.5" />
              답글
            </button>
          )}
        </div>
      </div>

      {/* Reply composer */}
      {replyOpen && depth < 2 && (
        <div className="pl-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 min-w-0">
              <CommentEditor
                placeholder="답글 입력... (@멘션 가능)"
                members={members}
                onSubmit={submitReply}
                onReady={(api) => { replyEditorApi.current = api; }}
              />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={submitReply}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Replies recursively */}
      {replies.length > 0 && (
        <div className="space-y-2 mt-2">
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              replies={[]}
              members={members}
              taskId={taskId}
              currentAuthor={currentAuthor}
              onChanged={onChanged}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
