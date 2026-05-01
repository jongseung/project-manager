"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoftDelete } from "@/hooks/use-soft-delete";
import { deleteProject, restoreProject } from "@/actions/project";

interface ProjectHeaderProps {
  projectId: string;
  projectName: string;
  projectColor?: string;
  workspaceName?: string;
  taskCount?: number;
  epicCount?: number;
  storyCount?: number;
}

const VIEWS = [
  { label: "칸반보드", path: "board" },
  { label: "백로그", path: "backlog" },
  { label: "목록", path: "list" },
  { label: "스토리", path: "stories" },
  { label: "OKR", path: "okr" },
  { label: "캘린더", path: "calendar" },
  { label: "타임라인", path: "timeline" },
  { label: "스프린트", path: "sprints" },
  { label: "리포트", path: "reports" },
] as const;

export function ProjectHeader({ projectId, projectName, projectColor, workspaceName, taskCount, epicCount, storyCount }: ProjectHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { del } = useSoftDelete({
    deleteFn: deleteProject,
    restoreFn: restoreProject,
    label: "프로젝트",
  });

  return (
    <div>
      <Header>
        <div className="flex items-center gap-2 mr-auto">
          {workspaceName && (
            <>
              <span className="text-xs text-muted-foreground">{workspaceName}</span>
              <span className="text-xs text-muted-foreground/40">/</span>
            </>
          )}
          {projectColor && (
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: projectColor }} />
          )}
          <span className="text-sm font-medium">{projectName}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => { e.preventDefault(); setConfirmOpen(true); }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> 프로젝트 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Header>
      <div className="border-b bg-sidebar px-6 py-1.5">
        <div className="flex gap-0.5">
          {VIEWS.map((view) => {
            const href = `/projects/${projectId}/${view.path}`;
            const isActive = pathname === href;
            return (
              <Link
                key={view.path}
                href={href}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                {view.label}
              </Link>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`"${projectName}" 프로젝트를 삭제할까요?`}
        description={`이 프로젝트와 하위 항목이 휴지통으로 이동됩니다.${taskCount || epicCount || storyCount ? ` (태스크 ${taskCount ?? 0}개, 에픽 ${epicCount ?? 0}개, 스토리 ${storyCount ?? 0}개)` : ""} 30일 내 복원 가능합니다.`}
        confirmLabel="삭제"
        onConfirm={async () => {
          del(projectId, {
            onDeleted: () => router.push("/dashboard"),
            itemName: projectName,
          });
          return { success: true };
        }}
      />
    </div>
  );
}
