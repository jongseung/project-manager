"use client";

import { useState, useMemo, useOptimistic, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { KANBAN_STATUSES, type TaskStatus } from "@/lib/constants";
import { reorderTasks } from "@/actions/task";
import type { Task } from "@prisma/client";

type BoardTask = Task & {
  labels?: { label: { id: string; name: string; color: string } }[];
  subtasks?: Task[];
  member?: { id: string; name: string; color: string } | null;
  comments?: { id: string }[];
  epic?: { id: string; name: string } | null;
  story?: { id: string; title: string } | null;
};

interface KanbanBoardProps {
  tasks: BoardTask[];
  onAddTask?: (status: TaskStatus) => void;
  onTaskClick?: (task: BoardTask) => void;
  sprintTaskMap?: Record<string, string>;
  sprints?: { id: string; name: string; status: string }[];
}

export function KanbanBoard({ tasks: initialTasks, onAddTask, onTaskClick, sprintTaskMap = {}, sprints = [] }: KanbanBoardProps) {
  const sprintNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    sprints.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [sprints]);
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(initialTasks);
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const PRIORITY_WEIGHT: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

  const getTasksByStatus = useCallback(
    (status: TaskStatus) =>
      optimisticTasks
        .filter((t) => t.status === status)
        .sort((a, b) => {
          const pa = PRIORITY_WEIGHT[a.priority] ?? 4;
          const pb = PRIORITY_WEIGHT[b.priority] ?? 4;
          if (pa !== pb) return pa - pb;
          return a.sortOrder - b.sortOrder;
        }),
    [optimisticTasks]
  );

  function handleDragStart(event: DragStartEvent) {
    const task = optimisticTasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = optimisticTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if dropping over a column
    const isOverColumn = KANBAN_STATUSES.includes(overId as TaskStatus);
    const newStatus = isOverColumn
      ? (overId as TaskStatus)
      : optimisticTasks.find((t) => t.id === overId)?.status;

    if (newStatus && newStatus !== activeTask.status) {
      setOptimisticTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t))
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const task = optimisticTasks.find((t) => t.id === activeId);
    if (!task) return;

    const isOverColumn = KANBAN_STATUSES.includes(overId as TaskStatus);
    const targetStatus = isOverColumn
      ? (overId as TaskStatus)
      : optimisticTasks.find((t) => t.id === overId)?.status ?? task.status;

    const columnTasks = optimisticTasks
      .filter((t) => t.status === targetStatus && t.id !== activeId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    let newOrder: { id: string; sortOrder: number; status?: string }[];

    if (isOverColumn || !optimisticTasks.find((t) => t.id === overId)) {
      // Dropped on column — append at end
      newOrder = [
        ...columnTasks.map((t, i) => ({ id: t.id, sortOrder: i })),
        { id: activeId, sortOrder: columnTasks.length, status: targetStatus },
      ];
    } else {
      // Dropped on a task — insert at position
      const overIndex = columnTasks.findIndex((t) => t.id === overId);
      const tasksWithActive = [...columnTasks];
      tasksWithActive.splice(overIndex >= 0 ? overIndex : columnTasks.length, 0, task);
      newOrder = tasksWithActive.map((t, i) => ({
        id: t.id,
        sortOrder: i,
        ...(t.id === activeId ? { status: targetStatus } : {}),
      }));
    }

    const result = await reorderTasks(newOrder);
    if (!result.success) {
      toast.error("태스크 정렬에 실패했습니다");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-6">
        {KANBAN_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={getTasksByStatus(status)}
            onAddTask={() => onAddTask?.(status)}
            onTaskClick={onTaskClick}
            sprintTaskMap={sprintTaskMap}
            sprintNameMap={sprintNameMap}
          />
        ))}
      </div>

      {/* @ts-expect-error -- @dnd-kit types lag React 19 */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
