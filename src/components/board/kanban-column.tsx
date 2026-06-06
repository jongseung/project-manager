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

// Status accent dots for quick column scanning.
const STATUS_DOT: Record<string, string> = {
  backlog: "bg-muted-foreground/40",
  todo: "bg-slate-400",
  in_progress: "bg-amber-400",
  in_review: "bg-violet-400",
  done: "bg-emerald-500",
  cancelled: "bg-muted-foreground/30",
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
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-1 flex items-center justify-between px-1.5 py-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status] ?? "bg-muted-foreground/40")} />
          <h3 className="text-[13px] font-semibold tracking-tight">{TASK_STATUS_LABELS[status]}</h3>
          <span
            className={cn(
              "rounded-full px-1.5 text-[11px] font-medium tabular-nums",
              isOverWip ? "bg-red-500/10 text-red-500" : "text-muted-foreground"
            )}
          >
            {tasks.length}{wipLimit !== undefined ? `/${wipLimit}` : ""}
          </span>
          {isOverWip && <AlertTriangle className="h-3 w-3 text-red-500" />}
        </div>
        {onAddTask && (
          <Button variant="ghost" size="icon-xs" className="h-6 w-6 text-muted-foreground/60 hover:text-foreground" onClick={onAddTask}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-xl border border-transparent p-1.5 min-h-[200px] transition-colors",
          isOver ? "border-primary/30 bg-primary/5" : "bg-muted/30",
          isOverWip && "ring-1 ring-red-400/40"
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
        {tasks.length === 0 && (
          <button
            onClick={onAddTask}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border/70 py-6 text-[11px] text-muted-foreground/60 transition-colors hover:border-border hover:text-muted-foreground"
          >
            <Plus className="h-3 w-3" /> 태스크 추가
          </button>
        )}
      </div>
    </div>
  );
}
