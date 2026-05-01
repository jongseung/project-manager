"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./task-card";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Task } from "@prisma/client";

// Default WIP limits when BoardView.wipLimits is not configured.
const DEFAULT_WIP_LIMITS: Partial<Record<TaskStatus, number>> = {
  in_progress: 5,
  in_review: 3,
};

type BoardTask = Task & {
  labels?: { label: { id: string; name: string; color: string } }[];
  subtasks?: Task[];
  member?: { id: string; name: string; color: string } | null;
  comments?: { id: string }[];
  epic?: { id: string; name: string } | null;
  story?: { id: string; title: string } | null;
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: BoardTask[];
  onAddTask?: () => void;
  onTaskClick?: (task: BoardTask) => void;
  sprintTaskMap?: Record<string, string>;
  sprintNameMap?: Record<string, string>;
  /** Overrides DEFAULT_WIP_LIMITS. null value disables limit for that status. */
  wipLimits?: Partial<Record<TaskStatus, number | null>>;
}

export function KanbanColumn({ status, tasks, onAddTask, onTaskClick, sprintTaskMap = {}, sprintNameMap = {}, wipLimits }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const override = wipLimits?.[status];
  const wipLimit = override === null ? undefined : (override ?? DEFAULT_WIP_LIMITS[status]);
  const isOverWip = wipLimit !== undefined && tasks.length > wipLimit;

  return (
    <div className={cn("flex w-72 shrink-0 flex-col", isOverWip && "ring-1 ring-red-300 rounded-lg")}>
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</h3>
          <span className={cn("text-xs rounded-full px-2 py-0.5", isOverWip ? "bg-red-100 text-red-600 font-medium" : "text-muted-foreground bg-muted")}>
            {tasks.length}{wipLimit !== undefined ? `/${wipLimit}` : ""}
          </span>
          {isOverWip && <AlertTriangle className="h-3 w-3 text-red-500" />}
        </div>
        {onAddTask && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddTask}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-lg p-2 min-h-[200px] transition-colors",
          isOver && "bg-accent/50"
        )}
      >
        {/* @ts-expect-error -- @dnd-kit types lag React 19 */}
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => {
            const sprintId = sprintTaskMap[task.id];
            const sprintName = sprintId ? sprintNameMap[sprintId] : undefined;
            return (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} sprintName={sprintName} />
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}
