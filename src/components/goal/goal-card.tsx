"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Target, MoreHorizontal, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSoftDelete } from "@/hooks/use-soft-delete";
import { deleteGoal, restoreGoal } from "@/actions/goal";
import { GOAL_STATUS_TONE } from "@/lib/status-styles";

const GOAL_LABEL: Record<string, string> = {
  not_started: "시작 전", in_progress: "진행 중", achieved: "달성", missed: "미달성", abandoned: "중단",
};

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    status: string;
    progress: number;
    totalTasks: number;
    completedTasks: number;
  };
}

export function GoalCard({ goal }: GoalCardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { del } = useSoftDelete({
    deleteFn: deleteGoal,
    restoreFn: restoreGoal,
    label: "목표",
  });

  return (
    <div className="relative group">
      <Link href={`/goals/${goal.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">{goal.title}</CardTitle>
              </div>
              <Badge className={GOAL_STATUS_TONE[goal.status] ?? ""} variant="secondary">
                {GOAL_LABEL[goal.status] ?? goal.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{goal.progress}%</span>
            </div>
            <CardDescription className="text-xs mt-1">
              태스크 {goal.completedTasks}/{goal.totalTasks} 완료
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.preventDefault()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => { e.preventDefault(); setConfirmOpen(true); }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`"${goal.title}" 목표를 삭제할까요?`}
        description="연결된 KPI는 유지되지만 이 목표는 휴지통으로 이동됩니다."
        confirmLabel="삭제"
        onConfirm={async () => {
          del(goal.id, { onDeleted: () => router.refresh(), itemName: goal.title });
          return { success: true };
        }}
      />
    </div>
  );
}
