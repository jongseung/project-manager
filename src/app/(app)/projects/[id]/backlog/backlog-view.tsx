"use client";

import { useState, useMemo } from "react";
import { Plus, ArrowRight, Check, Circle, CheckSquare, Filter, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskCreateDialog } from "@/components/task/task-create-dialog";
import { PriorityBadge } from "@/components/task/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useServerAction } from "@/hooks/use-server-action";
import { assignTaskToSprint } from "@/actions/sprint";
import { updateTask } from "@/actions/task";
import { cn } from "@/lib/utils";

interface BacklogTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  member: { id: string; name: string; color: string } | null;
  story: { id: string; title: string } | null;
  labels: { label: { id: string; name: string; color: string } }[];
  sprintTasks: { sprint: { id: string; name: string; status: string } }[];
  subtasks: { id: string; status: string }[];
}

interface BacklogViewProps {
  projectId: string;
  tasks: BacklogTask[];
  sprints: { id: string; name: string; status: string }[];
  stories: { id: string; title: string }[];
  members: { id: string; name: string; color: string }[];
}

function TaskRow({ task, sprints, onAssign, onToggle }: {
  task: BacklogTask;
  sprints: { id: string; name: string; status: string }[];
  onAssign: (taskId: string, sprintId: string) => void;
  onToggle: (id: string, status: string) => void;
}) {
  const isDone = task.status === "done";
  const inSprint = task.sprintTasks[0]?.sprint;
  const subtaskCount = task.subtasks.length;
  const subtaskDone = task.subtasks.filter((s) => s.status === "done").length;

  return (
    <div className={cn("group flex items-center gap-3 rounded-md px-3 py-2 border-b last:border-0 hover:bg-accent/30 transition-colors", isDone && "opacity-50")}>
      <button onClick={() => onToggle(task.id, isDone ? "todo" : "done")} className="shrink-0">
        {isDone ? <Check className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground/30 hover:text-primary" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>{task.title}</span>
          {task.labels.map(({ label }) => (
            <span key={label.id} className="inline-flex items-center text-[10px] font-medium text-muted-foreground shrink-0">
              <span style={{ color: label.color }}>#</span>{label.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {task.story && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <BookOpen className="h-2.5 w-2.5" />{task.story.title}
            </span>
          )}
          {subtaskCount > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <CheckSquare className="h-2.5 w-2.5" />{subtaskDone}/{subtaskCount}
            </span>
          )}
        </div>
      </div>

      <PriorityBadge priority={task.priority} />

      {task.member && (
        <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white shrink-0" style={{ backgroundColor: task.member.color }} title={task.member.name}>
          {task.member.name.charAt(0)}
        </div>
      )}

      {inSprint ? (
        <Badge variant="outline" className="text-[10px] shrink-0">{inSprint.name}</Badge>
      ) : (
        <Select onValueChange={(sprintId) => onAssign(task.id, sprintId)}>
          <SelectTrigger className="w-[140px] h-7 text-[10px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-3 w-3 mr-1" />
            <SelectValue placeholder="→ 스프린트" />
          </SelectTrigger>
          <SelectContent>
            {sprints.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                {s.status === "active" ? "[진행] " : "[계획] "}{s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function BacklogView({ projectId, tasks, sprints, stories, members }: BacklogViewProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStory, setFilterStory] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [filterSprint, setFilterSprint] = useState("none"); // "none" = not in any sprint, "all" = show all

  const { execute: assign } = useServerAction(
    async (input: { taskId: string; sprintId: string }) => assignTaskToSprint(input.sprintId, input.taskId),
    { successMessage: "스프린트에 추가됨" }
  );

  const { execute: toggle } = useServerAction(
    async (input: { id: string; status: string }) => updateTask(input),
  );

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStory !== "all" && t.story?.id !== filterStory) return false;
      if (filterMember !== "all" && t.member?.id !== filterMember) return false;
      if (filterSprint === "none" && t.sprintTasks.length > 0) return false;
      if (filterSprint !== "none" && filterSprint !== "all" && !t.sprintTasks.some((st) => st.sprint.id === filterSprint)) return false;
      return true;
    });
  }, [tasks, search, filterStory, filterMember, filterSprint]);

  const notInSprint = tasks.filter((t) => t.sprintTasks.length === 0 && t.status !== "done");
  const inActiveSprint = tasks.filter((t) => t.sprintTasks.some((st) => st.sprint.status === "active"));

  return (
    <>
      <div className="p-6 max-w-full space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">전체 {tasks.length}건</span>
            <span className="text-muted-foreground">백로그 {notInSprint.length}건</span>
            <span className="text-muted-foreground">진행 스프린트 {inActiveSprint.length}건</span>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> 새 태스크
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="검색..." className="w-[180px] h-8 text-xs" />

          <Select value={filterSprint} onValueChange={setFilterSprint}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">백로그만</SelectItem>
              <SelectItem value="all">전체 태스크</SelectItem>
              {sprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {stories.length > 0 && (
            <Select value={filterStory} onValueChange={setFilterStory}>
              <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="스토리" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 스토리</SelectItem>
                {stories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {members.length > 0 && (
            <Select value={filterMember} onValueChange={setFilterMember}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="담당자" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 담당자</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <span className="text-xs text-muted-foreground ml-auto">{filtered.length}건 표시</span>
        </div>

        {/* Guide */}
        {sprints.length === 0 && (
          <div className="bg-muted/50 rounded-md px-4 py-3 text-xs text-muted-foreground">
            <strong>스프린트가 없습니다.</strong> Sprints 탭에서 스프린트를 먼저 생성하면, 여기서 백로그 태스크를 스프린트에 할당할 수 있습니다.
          </div>
        )}

        {sprints.length > 0 && filterSprint === "none" && notInSprint.length > 0 && (
          <div className="bg-primary/5 rounded-md px-4 py-3 text-xs text-muted-foreground">
            태스크에 마우스를 올리면 [Sprint 할당] 버튼이 나타납니다. 클릭하면 해당 스프린트에 바로 배정됩니다.
          </div>
        )}

        {/* Task list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="h-12 w-12" />}
            title={search ? "검색 결과 없음" : "백로그가 비어있습니다"}
            description={search ? "다른 검색어를 시도하세요." : "새 태스크를 만들거나 Stories에서 분해하세요."}
            action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" />새 태스크</Button>}
          />
        ) : (
          <div className="border rounded-lg">
            {filtered.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                sprints={sprints}
                onAssign={(taskId, sprintId) => assign({ taskId, sprintId })}
                onToggle={(id, status) => toggle({ id, status })}
              />
            ))}
          </div>
        )}
      </div>

      <TaskCreateDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} defaultStatus="backlog" />
    </>
  );
}
