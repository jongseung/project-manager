"use client";

import { useState } from "react";
import { Undo2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { restoreWorkspace, purgeWorkspace } from "@/actions/workspace";
import { restoreProject, purgeProject } from "@/actions/project";
import { restoreGoal, purgeGoal } from "@/actions/goal";
import { restoreTask, purgeTask } from "@/actions/task";
import { restoreEpic, purgeEpic } from "@/actions/epic";
import { restoreStory, purgeStory } from "@/actions/story";
import { restoreSprint, purgeSprint } from "@/actions/sprint";
import { restoreMilestone, purgeMilestone } from "@/actions/milestone";

type Kind = "workspace" | "project" | "goal" | "task" | "epic" | "story" | "sprint" | "milestone";

type ActionPair = {
  restore: (id: string) => Promise<{ success: boolean; error?: string } | void>;
  purge: (id: string) => Promise<{ success: boolean; error?: string } | void>;
  label: string;
};

const ACTIONS: Record<Kind, ActionPair> = {
  workspace: { restore: restoreWorkspace, purge: purgeWorkspace, label: "워크스페이스" },
  project: { restore: restoreProject, purge: purgeProject, label: "프로젝트" },
  goal: { restore: restoreGoal, purge: purgeGoal, label: "목표" },
  task: { restore: restoreTask, purge: purgeTask, label: "태스크" },
  epic: { restore: restoreEpic, purge: purgeEpic, label: "에픽" },
  story: { restore: restoreStory, purge: purgeStory, label: "스토리" },
  sprint: { restore: restoreSprint, purge: purgeSprint, label: "스프린트" },
  milestone: { restore: restoreMilestone, purge: purgeMilestone, label: "마일스톤" },
};

interface TrashRowProps {
  id: string;
  kind: Kind;
  title: string;
  subtitle: string | null;
  archivedAgo: string;
}

export function TrashRow({ id, kind, title, subtitle, archivedAgo }: TrashRowProps) {
  const router = useRouter();
  const [restoring, setRestoring] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const pair = ACTIONS[kind];

  async function handleRestore() {
    setRestoring(true);
    try {
      const res = await pair.restore(id);
      if (res && "success" in res && !res.success) {
        toast.error(res.error ?? "복원 실패");
      } else {
        toast.success("복원되었습니다");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      toast.error("복원 중 오류");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 text-sm">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground">
          {subtitle && <span>{subtitle} · </span>}
          {archivedAgo}에 삭제
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={handleRestore} disabled={restoring}>
        <Undo2 className="h-3.5 w-3.5 mr-1" />
        {restoring ? "복원 중..." : "복원"}
      </Button>
      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPurgeOpen(true)}>
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        영구 삭제
      </Button>
      <ConfirmDialog
        open={purgeOpen}
        onOpenChange={setPurgeOpen}
        title={`"${title}"을(를) 영구 삭제할까요?`}
        description={`이 ${pair.label}과(와) 연결된 모든 하위 데이터가 함께 삭제됩니다. 되돌릴 수 없습니다.`}
        confirmLabel="영구 삭제"
        successMessage="영구 삭제되었습니다"
        onConfirm={() => pair.purge(id)}
      />
    </div>
  );
}
