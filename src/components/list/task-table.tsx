"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusSelect } from "@/components/task/status-select";
import { PriorityBadge } from "@/components/task/priority-badge";
import { useServerAction } from "@/hooks/use-server-action";
import { updateTask } from "@/actions/task";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import type { Task } from "@prisma/client";
import type { TaskStatus } from "@/lib/constants";

interface TaskTableProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
}

type SortKey = "title" | "status" | "priority" | "dueDate" | "createdAt";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

export function TaskTable({ tasks, onTaskClick, selectable, selectedIds }: TaskTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { execute: changeStatus } = useServerAction(
    async (input: { id: string; status: TaskStatus }) =>
      updateTask({ id: input.id, status: input.status })
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...tasks].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "title":
        return a.title.localeCompare(b.title) * dir;
      case "status":
        return a.status.localeCompare(b.status) * dir;
      case "priority":
        return ((PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 4) -
          (PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 4)) * dir;
      case "dueDate":
        return ((a.dueDate ?? "9999") > (b.dueDate ?? "9999") ? 1 : -1) * dir;
      case "createdAt":
        return (a.createdAt > b.createdAt ? 1 : -1) * dir;
      default:
        return 0;
    }
  });

  function SortHeader({ label, column }: { label: string; column: SortKey }) {
    return (
      <Button variant="ghost" size="sm" className="h-8 -ml-3 text-xs font-medium" onClick={() => toggleSort(column)}>
        {label}
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    );
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {selectable && <th className="w-[40px] p-3" />}
            <th className="text-left p-3"><SortHeader label="제목" column="title" /></th>
            <th className="text-left p-3 w-[150px]"><SortHeader label="상태" column="status" /></th>
            <th className="text-left p-3 w-[100px]"><SortHeader label="우선순위" column="priority" /></th>
            <th className="text-left p-3 w-[120px]"><SortHeader label="마감일" column="dueDate" /></th>
            <th className="text-left p-3 w-[120px]"><SortHeader label="생성일" column="createdAt" /></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => (
            <tr
              key={task.id}
              className="border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => onTaskClick?.(task)}
            >
              {selectable && (
                <td className="p-3 w-[40px]">
                  <input type="checkbox" checked={selectedIds?.has(task.id) ?? false} readOnly className="rounded border-gray-300" />
                </td>
              )}
              <td className="p-3">
                <span className={cn("text-sm", task.status === "done" && "line-through text-muted-foreground")}>
                  {task.title}
                </span>
              </td>
              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                <StatusSelect
                  value={task.status}
                  onValueChange={(status) => changeStatus({ id: task.id, status })}
                />
              </td>
              <td className="p-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="p-3">
                <span className={cn("text-sm", isOverdue(task.dueDate) && task.status !== "done" ? "text-red-500" : "text-muted-foreground")}>
                  {formatDate(task.dueDate)}
                </span>
              </td>
              <td className="p-3">
                <span className="text-sm text-muted-foreground">
                  {formatDate(task.createdAt.toISOString().split("T")[0])}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
