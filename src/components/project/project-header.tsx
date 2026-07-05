"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MoreHorizontal, Trash2, ChevronDown } from "lucide-react";
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

// Primary views stay as always-visible tabs; secondary views move into a
// "더보기" dropdown to keep the tab bar to a single, uncluttered row.
const PRIMARY_VIEWS = [
  { label: "흐름", path: "flow", desc: "프로젝트 현황·진행·병목을 한눈에" },
  { label: "칸반보드", path: "board", desc: "상태별로 태스크를 옮기며 실행" },
  { label: "목록", path: "list", desc: "필터·정렬로 태스크를 표로 관리" },
  { label: "타임라인", path: "timeline", desc: "일정을 간트 차트로 확인" },
  { label: "그래프", path: "graph", desc: "태스크·에픽·스토리 연결 관계" },
] as const;

const MORE_VIEWS = [
  { label: "백로그", path: "backlog", desc: "우선순위·스프린트 배정 대기 목록" },
  { label: "스토리", path: "stories", desc: "유저 스토리 단위로 묶어 관리" },
  { label: "OKR", path: "okr", desc: "목표·핵심결과(KR) 추적" },
  { label: "캘린더", path: "calendar", desc: "마감일을 달력으로 확인" },
  { label: "스프린트", path: "sprints", desc: "스프린트 계획·진행·회고" },
  { label: "리포트", path: "reports", desc: "번다운·속도·사이클타임 분석" },
] as const;

export function ProjectHeader({ projectId, projectName, projectColor, workspaceName, taskCount, epicCount, storyCount }: ProjectHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const moreActive = MORE_VIEWS.some((v) => pathname === `/projects/${projectId}/${v.path}`);

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
        <div className="flex items-center gap-0.5">
          {PRIMARY_VIEWS.map((view) => {
            const href = `/projects/${projectId}/${view.path}`;
            const isActive = pathname === href;
            return (
              <Link
                key={view.path}
                href={href}
                title={view.desc}
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

          {/* Secondary views grouped under 더보기 to keep one clean row */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  moreActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                더보기
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {MORE_VIEWS.map((view) => {
                const href = `/projects/${projectId}/${view.path}`;
                const isActive = pathname === href;
                return (
                  <DropdownMenuItem key={view.path} asChild>
                    <Link href={href} className={cn("flex flex-col items-start gap-0.5", isActive && "bg-accent")}>
                      <span className={cn("text-sm", isActive && "font-medium")}>{view.label}</span>
                      <span className="text-[11px] text-muted-foreground">{view.desc}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
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
