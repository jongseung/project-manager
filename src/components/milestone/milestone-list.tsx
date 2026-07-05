"use client";

import { useState } from "react";
import { Diamond, Plus, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MilestoneDialog } from "./milestone-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useServerAction } from "@/hooks/use-server-action";
import { useSoftDelete } from "@/hooks/use-soft-delete";
import { useRouter } from "next/navigation";
import { updateMilestone, deleteMilestone, restoreMilestone } from "@/actions/milestone";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MILESTONE_STATUS_TONE } from "@/lib/status-styles";
import type { Milestone } from "@prisma/client";

interface MilestoneListProps {
  projectId: string;
  milestones: Milestone[];
}

const MILESTONE_LABEL: Record<string, string> = { pending: "예정", reached: "달성", missed: "미달성" };

export function MilestoneList({ projectId, milestones }: MilestoneListProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { del } = useSoftDelete({ deleteFn: deleteMilestone, restoreFn: restoreMilestone, label: "마일스톤" });

  const { execute: markReached } = useServerAction(
    async (id: string) => updateMilestone(id, { status: "reached" }),
    { successMessage: "마일스톤 달성!" }
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">마일스톤</h3>
        <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> 추가
        </Button>
      </div>

      {milestones.length === 0 ? (
        <EmptyState icon={<Diamond className="h-8 w-8" />} title="마일스톤 없음" description="프로젝트의 주요 일정을 표시하세요." className="py-6" />
      ) : (
        milestones.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
            <Diamond className={cn("h-4 w-4 shrink-0", m.status === "reached" ? "text-green-500" : m.status === "missed" ? "text-red-500" : "text-yellow-500")} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{m.name}</span>
              <span className="text-xs text-muted-foreground ml-2">{formatDate(m.targetDate)}</span>
            </div>
            <Badge className={MILESTONE_STATUS_TONE[m.status] ?? ""} variant="secondary">{MILESTONE_LABEL[m.status] ?? m.status}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="마일스톤 옵션"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {m.status === "pending" && <DropdownMenuItem onClick={() => markReached(m.id)}>달성 처리</DropdownMenuItem>}
                <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); setConfirmId(m.id); }}><Trash2 className="h-4 w-4 mr-2" /> 삭제</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))
      )}

      <MilestoneDialog open={dialogOpen} onOpenChange={setDialogOpen} projectId={projectId} />
      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(v) => !v && setConfirmId(null)}
        title="이 마일스톤을 삭제할까요?"
        description="휴지통에서 30일 내 복원 가능합니다."
        onConfirm={async () => {
          if (confirmId) {
            del(confirmId, { onDeleted: () => router.refresh(), onRestored: () => router.refresh() });
          }
          return { success: true };
        }}
      />
    </div>
  );
}
