"use client";

import { Check, X, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/task/priority-badge";
import { useServerAction } from "@/hooks/use-server-action";
import { updateTask } from "@/actions/task";
import { removeFromDailyPlan } from "@/actions/daily";
import { cn, formatDate, isOverdue } from "@/lib/utils";
type DailyPlanData = {
  tasks: {
    task: {
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate: string | null;
      projectId: string;
      project: { name: string } | null;
    };
  }[];
};

interface DailyTasksProps {
  plan: DailyPlanData | null;
}

export function DailyTasks({ plan }: DailyTasksProps) {
  const { execute: toggleComplete } = useServerAction(
    async (input: { id: string; currentStatus: string }) => {
      const newStatus = input.currentStatus === "done" ? "todo" : "done";
      return updateTask({ id: input.id, status: newStatus });
    }
  );

  const { execute: removeTask } = useServerAction(
    async (taskId: string) => removeFromDailyPlan(taskId),
    { successMessage: "오늘 할 일에서 제거되었습니다" }
  );

  if (!plan || plan.tasks.length === 0) return null;

  return (
    <div className="space-y-1">
      {plan.tasks.map(({ task }) => {
        const isDone = task.status === "done";
        return (
          <div
            key={task.id}
            className={cn(
              "group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
              isDone ? "bg-muted/50" : "hover:bg-accent"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => toggleComplete({ id: task.id, currentStatus: task.status })}
            >
              <Check
                className={cn(
                  "h-4 w-4",
                  isDone ? "text-green-500" : "text-muted-foreground/40"
                )}
              />
            </Button>

            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {task.project && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    {task.project.name}
                  </span>
                )}
                {task.dueDate && (
                  <span className={cn("text-xs", isOverdue(task.dueDate) && !isDone ? "text-red-500" : "text-muted-foreground")}>
                    {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
            </div>

            <PriorityBadge priority={task.priority} />

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeTask(task.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
