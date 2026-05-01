"use client";

import { useState, useMemo } from "react";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TaskCreateDialog } from "@/components/task/task-create-dialog";
import { TaskDetailPanel } from "@/components/task/task-detail-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Kanban, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task, Project } from "@prisma/client";
import type { TaskWithRelations } from "@/types";
import type { TaskStatus } from "@/lib/constants";

interface BoardViewProps {
  project: Project;
  tasks: TaskWithRelations[];
  members: { id: string; name: string; color: string }[];
  labels: { id: string; name: string; color: string }[];
  epics?: { id: string; name: string }[];
  stories?: { id: string; title: string; epicId: string | null }[];
  sprints?: { id: string; name: string; status: string }[];
  sprintTaskMap?: Record<string, string>; // taskId → sprintId
}

export function BoardView({ project, tasks, members, labels, epics = [], stories = [], sprints = [], sprintTaskMap = {} }: BoardViewProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<string>("todo");
  const [selectedTask, setSelectedTask] = useState<{ id: string } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterMember, setFilterMember] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterLabel, setFilterLabel] = useState<string>("all");
  const [filterEpic, setFilterEpic] = useState<string>("all");
  const [filterStory, setFilterStory] = useState<string>("all");
  const [filterSprint, setFilterSprint] = useState<string>("all");

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterMember !== "all" && t.memberId !== filterMember) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterLabel !== "all" && !t.labels.some((l) => l.label.id === filterLabel)) return false;
      if (filterEpic !== "all" && t.epicId !== filterEpic) return false;
      if (filterStory !== "all" && t.storyId !== filterStory) return false;
      if (filterSprint !== "all") {
        const taskSprint = sprintTaskMap[t.id];
        if (!taskSprint || taskSprint !== filterSprint) return false;
      }
      return true;
    });
  }, [tasks, search, filterMember, filterPriority, filterLabel, filterEpic, filterStory, filterSprint, sprintTaskMap]);

  const hasFilters = search !== "" || filterMember !== "all" || filterPriority !== "all" || filterLabel !== "all" || filterEpic !== "all" || filterStory !== "all" || filterSprint !== "all";

  function handleAddTask(status: TaskStatus) {
    setCreateStatus(status);
    setCreateOpen(true);
  }

  function handleTaskClick(task: Task | TaskWithRelations) {
    setSelectedTask({ id: task.id });
    setDetailOpen(true);
  }

  function clearFilters() {
    setSearch("");
    setFilterMember("all");
    setFilterPriority("all");
    setFilterLabel("all");
    setFilterEpic("all");
    setFilterStory("all");
    setFilterSprint("all");
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="flex items-center gap-3 px-6 py-2 border-b flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="검색..." className="w-[160px] h-8 text-xs" />
        <Select value={filterMember} onValueChange={setFilterMember}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="담당자" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 멤버</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="우선순위" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 우선순위</SelectItem>
            <SelectItem value="urgent">긴급</SelectItem>
            <SelectItem value="high">높음</SelectItem>
            <SelectItem value="medium">보통</SelectItem>
            <SelectItem value="low">낮음</SelectItem>
          </SelectContent>
        </Select>

        {epics.length > 0 && (
          <Select value={filterEpic} onValueChange={setFilterEpic}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="에픽" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 에픽</SelectItem>
              {epics.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {stories.length > 0 && (
          <Select value={filterStory} onValueChange={setFilterStory}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="스토리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 스토리</SelectItem>
              {stories.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {sprints.length > 0 && (
          <Select value={filterSprint} onValueChange={setFilterSprint}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="스프린트" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 스프린트</SelectItem>
              {sprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.status === "active" ? "[진행] " : "[계획] "}{s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {labels.length > 0 && (
          <Select value={filterLabel} onValueChange={setFilterLabel}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="라벨" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 라벨</SelectItem>
              {labels.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
            Clear
          </Button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {filteredTasks.length}개 태스크
        </span>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<Kanban className="h-12 w-12" />}
          title="프로젝트에 태스크가 없습니다"
          description="첫 번째 태스크를 만들어보세요."
          action={
            <Button onClick={() => setCreateOpen(true)}>태스크 생성</Button>
          }
        />
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          onAddTask={handleAddTask}
          onTaskClick={handleTaskClick}
          sprintTaskMap={sprintTaskMap}
          sprints={sprints}
        />
      )}

      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={project.id}
        defaultStatus={createStatus}
      />
      <TaskDetailPanel
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
