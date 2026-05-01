"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { List, Plus, CheckSquare, Trash2, UserPlus, Flag } from "lucide-react";
import { TaskTable } from "@/components/list/task-table";
import { TaskCreateDialog } from "@/components/task/task-create-dialog";
import { TaskDetailPanel } from "@/components/task/task-detail-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedViewsMenu, type SavedViewItem } from "@/components/list/saved-views-menu";
import { useServerAction } from "@/hooks/use-server-action";
import { bulkUpdateTaskStatus } from "@/actions/import";
import { bulkDeleteTasks, bulkAssignMember, bulkSetPriority, bulkRestoreTasks } from "@/actions/task";
import { TASK_STATUSES, TASK_STATUS_LABELS, TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import type { Task, Project } from "@prisma/client";

interface ListViewProps {
  project: Project;
  tasks: Task[];
  members: { id: string; name: string; color: string }[];
  savedViews: SavedViewItem[];
}

export function ListView({ project, tasks, members, savedViews }: ListViewProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ id: string } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [memberFilter, setMemberFilter] = useState<string>("");
  const [activeViewName, setActiveViewName] = useState<string | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (memberFilter) {
        if (memberFilter === "__unassigned__" && t.memberId !== null) return false;
        if (memberFilter !== "__unassigned__" && t.memberId !== memberFilter) return false;
      }
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, memberFilter]);

  const currentConfig = useMemo(
    () => ({ search, statusFilter, priorityFilter, memberFilter }),
    [search, statusFilter, priorityFilter, memberFilter],
  );

  function applyView(cfg: Record<string, unknown>) {
    setSearch((cfg.search as string) ?? "");
    setStatusFilter((cfg.statusFilter as string) ?? "");
    setPriorityFilter((cfg.priorityFilter as string) ?? "");
    setMemberFilter((cfg.memberFilter as string) ?? "");
  }

  function resetFilters() {
    setSearch(""); setStatusFilter(""); setPriorityFilter(""); setMemberFilter("");
    setActiveViewName(undefined);
  }

  const hasActiveFilters = !!(search || statusFilter || priorityFilter || memberFilter);

  const selectedCount = selectedIds.size;

  const { execute: bulkUpdate, isPending: statusPending } = useServerAction(
    async (input: { taskIds: string[]; status: string }) =>
      bulkUpdateTaskStatus(input.taskIds, input.status),
    { successMessage: "상태가 일괄 변경되었습니다", onSuccess: () => clearSelection() }
  );
  const { execute: bulkPriority, isPending: priorityPending } = useServerAction(
    async (input: { taskIds: string[]; priority: string }) =>
      bulkSetPriority(input.taskIds, input.priority),
    { successMessage: "우선순위가 일괄 변경되었습니다", onSuccess: () => clearSelection() }
  );
  const { execute: bulkAssign, isPending: assignPending } = useServerAction(
    async (input: { taskIds: string[]; memberId: string | null }) =>
      bulkAssignMember(input.taskIds, input.memberId),
    { successMessage: "담당자가 일괄 변경되었습니다", onSuccess: () => clearSelection() }
  );

  const anyPending = statusPending || priorityPending || assignPending;

  function clearSelection() {
    setSelectedIds(new Set());
    setBulkMode(false);
  }

  function handleTaskClick(task: Task) {
    if (bulkMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(task.id)) next.delete(task.id);
        else next.add(task.id);
        return next;
      });
    } else {
      setSelectedTask({ id: task.id });
      setDetailOpen(true);
    }
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    }
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    const res = await bulkDeleteTasks(ids);
    if (!res.success) { toast.error(res.error ?? "일괄 삭제 실패"); return; }
    toast.success(`${res.data.affected}개 태스크가 삭제되었습니다`, {
      description: "휴지통에서 복원할 수 있습니다.",
      duration: 6000,
      action: {
        label: "실행 취소",
        onClick: async () => {
          const r = await bulkRestoreTasks(ids);
          if (r.success) toast.success(`${r.data.affected}개 복원됨`);
          else toast.error(r.error ?? "복원 실패");
        },
      },
    });
    clearSelection();
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <div className="flex gap-2 items-center flex-wrap">
          <SavedViewsMenu
            projectId={project.id}
            scope="list"
            views={savedViews}
            currentConfig={currentConfig}
            activeName={activeViewName}
            onApply={(cfg) => { applyView(cfg); setActiveViewName(undefined); /* name unknown until menu sets it */ }}
            onChanged={() => router.refresh()}
          />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-[180px] h-8 text-xs"
          />

          <Select value={statusFilter || "__all__"} onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="상태" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">모든 상태</SelectItem>
              {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={priorityFilter || "__all__"} onValueChange={(v) => setPriorityFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="우선순위" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">모든 우선순위</SelectItem>
              {TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={memberFilter || "__all__"} onValueChange={(v) => setMemberFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="담당자" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">모든 담당자</SelectItem>
              <SelectItem value="__unassigned__">할당 안 됨</SelectItem>
              {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={resetFilters} className="h-8 text-xs">
              초기화
            </Button>
          )}

          <Button
            size="sm"
            variant={bulkMode ? "default" : "outline"}
            onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
          >
            <CheckSquare className="h-4 w-4 mr-1" /> {bulkMode ? "취소" : "선택"}
          </Button>

          {bulkMode && selectedCount > 0 && (
            <>
              <span className="text-xs text-muted-foreground px-1">{selectedCount}개 선택</span>
              <Button size="sm" variant="outline" onClick={toggleSelectAll}>
                {selectedIds.size === filteredTasks.length ? "전체 해제" : "전체 선택"}
              </Button>

              <Select onValueChange={(status) => bulkUpdate({ taskIds: [...selectedIds], status })} disabled={anyPending}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="상태 변경" /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={(priority) => bulkPriority({ taskIds: [...selectedIds], priority })} disabled={anyPending}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <div className="flex items-center gap-1"><Flag className="h-3 w-3" /><SelectValue placeholder="우선순위" /></div>
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) => bulkAssign({ taskIds: [...selectedIds], memberId: val === "__none__" ? null : val })}
                disabled={anyPending}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <div className="flex items-center gap-1"><UserPlus className="h-3 w-3" /><SelectValue placeholder="담당자" /></div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">담당자 없음</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={anyPending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> 삭제
              </Button>
            </>
          )}
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> 태스크 추가
        </Button>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<List className="h-12 w-12" />}
          title={search ? "일치하는 태스크가 없습니다" : "프로젝트에 태스크가 없습니다"}
          description={search ? "다른 검색어를 시도하세요." : "첫 번째 태스크를 만들어보세요."}
          action={!search ? <Button onClick={() => setCreateOpen(true)}>태스크 생성</Button> : undefined}
        />
      ) : (
        <TaskTable
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          selectable={bulkMode}
          selectedIds={selectedIds}
        />
      )}

      <TaskCreateDialog open={createOpen} onOpenChange={setCreateOpen} projectId={project.id} />
      <TaskDetailPanel task={selectedTask} open={detailOpen} onOpenChange={setDetailOpen} />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`${selectedCount}개 태스크를 삭제할까요?`}
        description="선택한 태스크가 휴지통으로 이동됩니다. 30일 내 복원 가능합니다."
        confirmLabel={`${selectedCount}개 삭제`}
        onConfirm={async () => { await handleBulkDelete(); return { success: true }; }}
      />
    </div>
  );
}
