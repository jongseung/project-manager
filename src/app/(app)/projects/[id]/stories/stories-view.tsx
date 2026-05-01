"use client";

import { useState } from "react";
import { StoryDialog } from "@/components/story/story-dialog";
import { StoryCard } from "@/components/story/story-card";
import { TaskCreateDialog } from "@/components/task/task-create-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { STORY_STATUSES, STORY_STATUS_LABELS } from "@/lib/constants";
import type { StoryStatus } from "@/lib/constants";

interface StoriesViewProps {
  projectId: string;
  epics: { id: string; name: string }[];
  stories: {
    id: string;
    epicId: string | null;
    title: string;
    description: string | null;
    userStory: string | null;
    storyPoints: number | null;
    status: string;
    priority: string;
    tasks: { id: string; status: string }[];
    krLinks: { keyResult: { title: string; objective: { title: string } } }[];
  }[];
  objectives: {
    id: string;
    title: string;
    keyResults: { id: string; title: string }[];
  }[];
}

export function StoriesView({ projectId, epics, stories, objectives }: StoriesViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStory, setEditStory] = useState<StoriesViewProps["stories"][number] | null>(null);
  const [decomposeStoryId, setDecomposeStoryId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  function openCreate() {
    setEditStory(null);
    setDialogOpen(true);
  }

  function openEdit(s: StoriesViewProps["stories"][number]) {
    setEditStory(s);
    setDialogOpen(true);
  }

  function openDecompose(storyId: string) {
    setDecomposeStoryId(storyId);
    setTaskDialogOpen(true);
  }

  // Group by status
  const grouped = STORY_STATUSES.reduce((acc, status) => {
    const items = stories.filter((s) => s.status === status);
    if (items.length > 0) acc.push({ status, label: STORY_STATUS_LABELS[status], items });
    return acc;
  }, [] as { status: string; label: string; items: typeof stories }[]);

  const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
  const donePoints = stories.filter((s) => s.status === "done").reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);

  return (
    <>
      <div className="p-6 max-w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{stories.length} stories</span>
            {totalPoints > 0 && (
              <span className="text-sm text-muted-foreground">{donePoints}/{totalPoints} points done</span>
            )}
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />Story
          </Button>
        </div>

        {stories.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-12 w-12" />}
            title="스토리가 없습니다"
            description="프로젝트를 사용자 스토리로 분해하여 업무를 계획하고 추적하세요."
            action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />스토리 추가</Button>}
          />
        ) : (
          grouped.map(({ status, label, items }) => (
            <div key={status} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {label} ({items.length})
              </h2>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <StoryCard
                    key={s.id}
                    story={s}
                    onEdit={() => openEdit(s)}
                    onDecompose={() => openDecompose(s.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <StoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        epics={epics}
        story={editStory}
      />

      {decomposeStoryId && (
        <TaskCreateDialog
          open={taskDialogOpen}
          onOpenChange={(open) => { setTaskDialogOpen(open); if (!open) setDecomposeStoryId(null); }}
          projectId={projectId}
          defaultStatus="todo"
          storyId={decomposeStoryId}
        />
      )}
    </>
  );
}
