"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MoreHorizontal, Pencil, Trash2, ListTodo } from "lucide-react";
import { useServerAction } from "@/hooks/use-server-action";
import { useSoftDelete } from "@/hooks/use-soft-delete";
import { deleteStory, restoreStory, updateStory } from "@/actions/story";
import { STORY_STATUS_LABELS } from "@/lib/constants";
import { PriorityBadge } from "@/components/task/priority-badge";
import type { StoryStatus } from "@/lib/constants";

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    description: string | null;
    userStory: string | null;
    storyPoints: number | null;
    status: string;
    priority: string;
    tasks: { id: string; status: string }[];
    krLinks: { keyResult: { title: string; objective: { title: string } } }[];
  };
  onEdit: () => void;
  onDecompose: () => void;
}

export function StoryCard({ story, onEdit, onDecompose }: StoryCardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { del } = useSoftDelete({ deleteFn: deleteStory, restoreFn: restoreStory, label: "스토리" });
  const { execute: changeStatus } = useServerAction(
    async (status: string) => updateStory(story.id, { status }),
  );

  const totalTasks = story.tasks.length;
  const doneTasks = story.tasks.filter((t) => t.status === "done").length;
  const statusLabel = STORY_STATUS_LABELS[story.status as StoryStatus] ?? story.status;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">{story.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onDecompose}><ListTodo className="h-3.5 w-3.5 mr-2" />Decompose to Tasks</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeStatus(story.status === "done" ? "todo" : "done")}>
                {story.status === "done" ? "Reopen" : "Mark Done"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); setConfirmOpen(true); }}><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title={`"${story.title}" 스토리를 삭제할까요?`}
            description={totalTasks > 0 ? `연결된 태스크 ${totalTasks}개의 스토리 연결이 해제됩니다. 휴지통에서 30일 내 복원 가능합니다.` : "휴지통에서 30일 내 복원 가능합니다."}
            onConfirm={async () => {
              del(story.id, { itemName: story.title, onDeleted: () => router.refresh(), onRestored: () => router.refresh() });
              return { success: true };
            }}
          />
        </div>

        {story.userStory && (
          <CardDescription className="text-xs italic">{story.userStory}</CardDescription>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">{statusLabel}</Badge>
          <PriorityBadge priority={story.priority} />
          {story.storyPoints && (
            <Badge variant="secondary" className="text-xs">{story.storyPoints} pts</Badge>
          )}
        </div>

        {totalTasks > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{doneTasks}/{totalTasks}</span>
          </div>
        )}

        {story.krLinks.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {story.krLinks.map((link) => (
              <div key={link.keyResult.title} className="text-xs text-muted-foreground">
                → {link.keyResult.objective.title}: {link.keyResult.title}
              </div>
            ))}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
