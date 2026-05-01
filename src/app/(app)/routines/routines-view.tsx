"use client";

import { useState } from "react";
import { RecurringDialog } from "@/components/recurring/recurring-dialog";
import { RecurringCard } from "@/components/recurring/recurring-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Repeat } from "lucide-react";

interface RoutinesViewProps {
  templates: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    frequency: string;
    interval: number;
    daysOfWeek: string;
    dayOfMonth: number | null;
    timeOfDay: string | null;
    isActive: boolean;
    nextRunAt: Date;
    lastRunAt: Date | null;
    projectId: string | null;
    memberId: string | null;
    subtaskTemplates: { id: string; title: string }[];
    _count: { tasks: number };
  }[];
  workspaces: { id: string; name: string; projects: { id: string; name: string }[] }[];
  members: { id: string; name: string }[];
}

export function RoutinesView({ templates, workspaces, members }: RoutinesViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<RoutinesViewProps["templates"][number] | null>(null);

  const allProjects = workspaces.flatMap((ws) => ws.projects);
  const defaultWorkspaceId = workspaces[0]?.id ?? "";

  const active = templates.filter((t) => t.isActive);
  const inactive = templates.filter((t) => !t.isActive);

  function openCreate() {
    setEditTemplate(null);
    setDialogOpen(true);
  }

  function openEdit(t: RoutinesViewProps["templates"][number]) {
    setEditTemplate(t);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="p-6 max-w-full space-y-6">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              주기적으로 반복되는 업무를 등록하면 자동으로 태스크가 생성됩니다. 일일 점검, 주간 리뷰, 월간 보고 등을 관리하세요.
            </p>
          </div>
          <Button onClick={openCreate} size="sm" className="shrink-0">
            <Plus className="h-4 w-4 mr-1" />
            반복 업무 추가
          </Button>
        </div>

        {templates.length === 0 ? (
          <EmptyState
            icon={<Repeat className="h-12 w-12" />}
            title="등록된 반복 업무가 없습니다"
            description="반복 업무를 등록하면 설정된 주기에 맞춰 자동으로 태스크가 생성됩니다."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                첫 반복 업무 등록하기
              </Button>
            }
          />
        ) : (
          <>
            {active.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">활성 ({active.length})</h2>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {active.map((t) => (
                    <RecurringCard key={t.id} template={t} onEdit={() => openEdit(t)} />
                  ))}
                </div>
              </div>
            )}

            {inactive.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">일시 중지 ({inactive.length})</h2>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {inactive.map((t) => (
                    <RecurringCard key={t.id} template={t} onEdit={() => openEdit(t)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <RecurringDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={editTemplate ? (workspaces.find((ws) => ws.projects.some((p) => p.id === editTemplate.projectId))?.id ?? defaultWorkspaceId) : defaultWorkspaceId}
        projects={allProjects}
        members={members}
        template={editTemplate}
      />
    </>
  );
}
