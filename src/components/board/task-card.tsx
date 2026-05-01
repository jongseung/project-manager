"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, CheckSquare, MessageSquare, Repeat, Zap } from "lucide-react";
import { PriorityBadge } from "@/components/task/priority-badge";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import type { Task } from "@prisma/client";

type TaskWithRelations = Task & {
  labels?: { label: { id: string; name: string; color: string } }[];
  subtasks?: Task[];
  member?: { id: string; name: string; color: string } | null;
  comments?: { id: string }[];
  epic?: { id: string; name: string } | null;
  story?: { id: string; title: string } | null;
};

interface TaskCardProps {
  task: TaskWithRelations;
  onClick?: () => void;
  sprintName?: string;
}

export function TaskCard({ task, onClick, sprintName }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const subtaskCount = task.subtasks?.length ?? 0;
  const subtaskDone = task.subtasks?.filter((s) => s.status === "done").length ?? 0;
  const commentCount = task.comments?.length ?? 0;
  const taskLabels = task.labels ?? [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-2 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md cursor-pointer",
        isDragging && "opacity-50 shadow-lg"
      )}
      onClick={onClick}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        {/* Title + Priority */}
        <div className="flex items-start gap-1.5">
          {task.recurrence !== "none" && task.recurrence && (
            <Repeat className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium leading-tight flex-1 min-w-0">{task.title}</p>
          <PriorityBadge priority={task.priority} size="sm" className="shrink-0 mt-0.5" />
        </div>

        {/* Epic / Story / Sprint badges */}
        {(task.epic || task.story || sprintName) && (
          <div className="flex gap-1 flex-wrap">
            {task.epic && (
              <span className="inline-flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-medium bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {task.epic.name}
              </span>
            )}
            {task.story && (
              <span className="inline-flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {task.story.title}
              </span>
            )}
            {sprintName && (
              <span className="inline-flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800">
                <Zap className="h-2.5 w-2.5" />{sprintName}
              </span>
            )}
          </div>
        )}

        {/* Labels */}
        {taskLabels.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {taskLabels.map(({ label }) => (
              <span
                key={label.id}
                className="inline-flex items-center text-[10px] font-medium text-muted-foreground"
              >
                <span style={{ color: label.color }}>#</span>
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* Meta: due date, subtasks, comments */}
        {(task.dueDate || subtaskCount > 0 || commentCount > 0) && (
          <div className="flex items-center gap-2 flex-wrap">
            {task.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-[11px]",
                  isOverdue(task.dueDate) ? "text-red-500" : "text-muted-foreground"
                )}
              >
                <Calendar className="h-2.5 w-2.5" />
                {formatDate(task.dueDate)}
              </span>
            )}
            {subtaskCount > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <CheckSquare className="h-2.5 w-2.5" />
                {subtaskDone}/{subtaskCount}
              </span>
            )}
            {commentCount > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <MessageSquare className="h-2.5 w-2.5" />
                {commentCount}
              </span>
            )}
          </div>
        )}

        {/* Assignee */}
        {task.member && (
          <div className="flex items-center gap-1">
            <div
              className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-medium text-white"
              style={{ backgroundColor: task.member.color }}
            >
              {task.member.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] text-muted-foreground">{task.member.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
