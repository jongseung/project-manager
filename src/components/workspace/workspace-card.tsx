"use client";

import { useState } from "react";
import { Briefcase, MoreHorizontal, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSoftDelete } from "@/hooks/use-soft-delete";
import { deleteWorkspace, restoreWorkspace } from "@/actions/workspace";
import type { WorkspaceWithProjects } from "@/types";

export interface WorkspaceStats {
  activeProjects: number;
  total: number;
  done: number;
  inReview: number;
  inProgress: number;
  todo: number;
  overdue: number;
}

interface WorkspaceCardProps {
  workspace: WorkspaceWithProjects;
  stats?: WorkspaceStats;
}

export function WorkspaceCard({ workspace, stats }: WorkspaceCardProps) {
  const pct = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { del } = useSoftDelete({
    deleteFn: deleteWorkspace,
    restoreFn: restoreWorkspace,
    label: "워크스페이스",
  });

  return (
    <div className="relative group">
      <Link href={`/workspaces/${workspace.id}`}>
        <Card className="cursor-pointer transition-colors hover:border-foreground/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: workspace.color }}
              >
                <Briefcase className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{workspace.name}</CardTitle>
                <CardDescription>
                  프로젝트 {workspace.projects.length}개
                  {stats && stats.activeProjects > 0 && ` · 진행중 ${stats.activeProjects}`}
                </CardDescription>
              </div>
            </div>

            {/* At-a-glance workspace progress */}
            {stats && stats.total > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{stats.done}/{stats.total} 완료</span>
                  <span className="flex items-center gap-2 tabular-nums">
                    {stats.overdue > 0 && <span className="font-medium text-red-500">지연 {stats.overdue}</span>}
                    <span className="font-semibold">{pct}%</span>
                  </span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-emerald-500" style={{ width: `${(stats.done / stats.total) * 100}%` }} />
                  <div className="h-full bg-violet-400" style={{ width: `${(stats.inReview / stats.total) * 100}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }} />
                  <div className="h-full bg-slate-400" style={{ width: `${(stats.todo / stats.total) * 100}%` }} />
                </div>
              </div>
            )}
          </CardHeader>
        </Card>
      </Link>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="워크스페이스 옵션" onClick={(e) => e.preventDefault()}>
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
        title={`"${workspace.name}" 워크스페이스를 삭제할까요?`}
        description="이 워크스페이스와 하위 프로젝트 전체가 휴지통으로 이동됩니다. 30일 내 복원 가능합니다."
        confirmLabel="삭제"
        onConfirm={async () => {
          del(workspace.id, { onDeleted: () => router.refresh(), itemName: workspace.name });
          return { success: true };
        }}
      />
    </div>
  );
}
