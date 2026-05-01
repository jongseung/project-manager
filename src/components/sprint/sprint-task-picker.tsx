"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerAction } from "@/hooks/use-server-action";
import { assignTaskToSprint } from "@/actions/sprint";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/task/priority-badge";

interface TaskOption {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface SprintTaskPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintId: string;
  availableTasks: TaskOption[];
  assignedTaskIds: string[];
}

export function SprintTaskPicker({ open, onOpenChange, sprintId, availableTasks, assignedTaskIds }: SprintTaskPickerProps) {
  const [search, setSearch] = useState("");

  const { execute: assign } = useServerAction(
    async (taskId: string) => assignTaskToSprint(sprintId, taskId),
    { successMessage: "스프린트에 태스크가 추가되었습니다" }
  );

  const filtered = availableTasks.filter(
    (t) => !assignedTaskIds.includes(t.id) && t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>스프린트에 태스크 추가</DialogTitle></DialogHeader>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="태스크 검색..." className="mb-3" autoFocus />
        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {search ? "일치하는 태스크가 없습니다." : "모든 태스크가 이미 배정되었습니다."}
            </p>
          ) : (
            filtered.map((task) => (
              <button
                key={task.id}
                className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent text-left"
                onClick={() => assign(task.id)}
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{task.title}</span>
                <PriorityBadge priority={task.priority} />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
