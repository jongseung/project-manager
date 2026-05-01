"use client";

import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerAction } from "@/hooks/use-server-action";
import { createTask, updateTask } from "@/actions/task";
import { cn } from "@/lib/utils";
import type { Task } from "@prisma/client";

interface SubtaskListProps {
  parentTask: Task;
  subtasks: Task[];
}

export function SubtaskList({ parentTask, subtasks }: SubtaskListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");

  const { execute: addSubtask, isPending } = useServerAction(
    async (input: unknown) => createTask(input),
    {
      successMessage: "서브태스크가 추가되었습니다",
      onSuccess: () => { setTitle(""); setShowAdd(false); },
    }
  );

  const { execute: toggleStatus } = useServerAction(
    async (input: { id: string; status: string }) =>
      updateTask({ id: input.id, status: input.status === "done" ? "todo" : "done" })
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addSubtask({
      projectId: parentTask.projectId,
      parentTaskId: parentTask.id,
      title: title.trim(),
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Subtasks ({subtasks.filter((s) => s.status === "done").length}/{subtasks.length})
        </span>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {subtasks.map((sub) => (
        <div key={sub.id} className="flex items-center gap-2 pl-2">
          <Button
            variant="ghost" size="icon" className="h-5 w-5"
            onClick={() => toggleStatus({ id: sub.id, status: sub.status })}
          >
            <Check className={cn("h-3 w-3", sub.status === "done" ? "text-green-500" : "text-muted-foreground/30")} />
          </Button>
          <span className={cn("text-sm", sub.status === "done" && "line-through text-muted-foreground")}>
            {sub.title}
          </span>
        </div>
      ))}

      {showAdd && (
        <form onSubmit={handleAdd} className="flex gap-2 pl-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Subtask title" className="h-7 text-sm flex-1" autoFocus />
          <Button type="submit" size="sm" className="h-7" disabled={!title.trim() || isPending}>Add</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setShowAdd(false)}>
            <X className="h-3 w-3" />
          </Button>
        </form>
      )}
    </div>
  );
}
