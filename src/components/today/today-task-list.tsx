"use client";

import { Check, Circle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/task/priority-badge";
import { useServerAction } from "@/hooks/use-server-action";
import { updateTask } from "@/actions/task";
import { cn, formatDate, isOverdue } from "@/lib/utils";

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  project?: { name: string; color: string } | null;
  member?: { name: string } | null;
  subtasks?: { id: string; status: string }[];
}

interface TodayTaskListProps {
  tasks: TaskItem[];
  showDueDate?: boolean;
  showSubtasks?: boolean;
}

function TaskRow({ task, showDueDate, showSubtasks }: { task: TaskItem; showDueDate?: boolean; showSubtasks?: boolean }) {
  const { execute: toggle } = useServerAction(
    async (input: { id: string; status: string }) => updateTask(input),
  );

  const isDone = task.status === "done";
  const subtaskCount = task.subtasks?.length ?? 0;
  const subtaskDone = task.subtasks?.filter((s) => s.status === "done").length ?? 0;

  return (
    <div className={cn(
      "group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors",
      isDone ? "opacity-60" : "hover:bg-accent/50"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={() => toggle({ id: task.id, status: isDone ? "todo" : "done" })}
      >
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground/40" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.project && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: task.project.color }} />
              <span className="text-xs text-muted-foreground">{task.project.name}</span>
            </div>
          )}
          {task.member && (
            <span className="text-xs text-muted-foreground">· {task.member.name}</span>
          )}
          {showDueDate && task.dueDate && (
            <span className={cn("text-xs", isOverdue(task.dueDate) ? "text-red-500 font-medium" : "text-muted-foreground")}>
              · {formatDate(task.dueDate)}
            </span>
          )}
          {showSubtasks && subtaskCount > 0 && (
            <span className="text-xs text-muted-foreground">
              · {subtaskDone}/{subtaskCount} 서브태스크
            </span>
          )}
        </div>
      </div>

      <PriorityBadge priority={task.priority} />
    </div>
  );
}

export function TodayTaskList({ tasks, showDueDate, showSubtasks }: TodayTaskListProps) {
  return (
    <div className="space-y-0.5">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} showDueDate={showDueDate} showSubtasks={showSubtasks} />
      ))}
    </div>
  );
}
