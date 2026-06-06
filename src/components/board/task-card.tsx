"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, CheckSquare, MessageSquare, Repeat, Zap } from "lucide-react";
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

// Priority signal — a small colored dot. Status colors are allowed in a
// minimal palette; everything else stays on semantic tokens.
const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-sky-400",
};
const PRIORITY_LABEL: Record<string, string> = {
  urgent: "긴급",
  high: "높음",
  medium: "보통",
  low: "낮음",
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-[140px] items-center gap-0.5 truncate rounded border border-border bg-muted/60 px-1.5 py-px text-[10px] font-medium text-muted-foreground">
      {children}
    </span>
  );
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
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-pointer rounded-lg border border-border bg-card p-2.5 shadow-xs transition-all",
        "hover:border-foreground/15 hover:shadow-sm",
        isDragging && "rotate-[0.5deg] opacity-60 shadow-lg ring-1 ring-primary/30"
      )}
      onClick={onClick}
    >
      {/* Drag handle — revealed on hover */}
      <button
        {...attributes}
        {...listeners}
        aria-label="드래그하여 이동"
        className="absolute -left-0.5 top-2 cursor-grab text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40 hover:!text-muted-foreground active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="space-y-1.5">
        {/* Title row */}
        <div className="flex items-start gap-1.5">
          {task.priority && PRIORITY_DOT[task.priority] && (
            <span
              className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", PRIORITY_DOT[task.priority])}
              title={PRIORITY_LABEL[task.priority]}
            />
          )}
          {task.recurrence && task.recurrence !== "none" && (
            <Repeat className="mt-0.5 h-3 w-3 shrink-0 text-sky-400" />
          )}
          <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug">{task.title}</p>
        </div>

        {/* Epic / Story / Sprint */}
        {(task.epic || task.story || sprintName) && (
          <div className="flex flex-wrap gap-1">
            {task.epic && <Chip>{task.epic.name}</Chip>}
            {task.story && <Chip>{task.story.title}</Chip>}
            {sprintName && (
              <Chip>
                <Zap className="h-2.5 w-2.5 text-primary" />
                {sprintName}
              </Chip>
            )}
          </div>
        )}

        {/* Labels */}
        {taskLabels.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {taskLabels.map(({ label }) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer: meta + assignee */}
        {(task.dueDate || subtaskCount > 0 || commentCount > 0 || task.member) && (
          <div className="flex items-center gap-2.5 pt-0.5">
            {task.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1 text-[11px]",
                  overdue ? "font-medium text-red-500" : "text-muted-foreground"
                )}
              >
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
            {subtaskCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <CheckSquare className="h-3 w-3" />
                {subtaskDone}/{subtaskCount}
              </span>
            )}
            {commentCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {commentCount}
              </span>
            )}
            {task.member && (
              <div
                className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white ring-2 ring-card"
                style={{ backgroundColor: task.member.color }}
                title={task.member.name}
              >
                {task.member.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
