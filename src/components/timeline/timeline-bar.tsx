"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServerAction } from "@/hooks/use-server-action";
import { updateTask } from "@/actions/task";

interface TimelineBarProps {
  taskId: string;
  title: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  startOffset: number;
  duration: number;
  dayWidth: number;
  totalDays: number;
}

export function TimelineBar({ taskId, title, status, startDate, dueDate, startOffset, duration, dayWidth, totalDays }: TimelineBarProps) {
  const barWidth = duration * dayWidth;
  const barLeft = startOffset * dayWidth;
  const [editStart, setEditStart] = useState(startDate ?? "");
  const [editDue, setEditDue] = useState(dueDate ?? "");
  const [open, setOpen] = useState(false);

  const isOverdue = dueDate && status !== "done" && status !== "cancelled" && dueDate < new Date().toISOString().split("T")[0];

  const { execute: save, isPending } = useServerAction(
    async (input: Parameters<typeof updateTask>[0]) => updateTask(input),
    { successMessage: "일정이 수정되었습니다", onSuccess: () => setOpen(false) }
  );

  return (
    <div className="h-9 relative" style={{ width: totalDays * dayWidth }}>
      {/* Day grid lines */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: totalDays }).map((_, i) => (
          <div key={i} className="border-r border-muted/30 shrink-0" style={{ width: dayWidth }} />
        ))}
      </div>

      {/* Bar */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "absolute top-1.5 h-6 rounded-md px-2 flex items-center text-xs font-medium shadow-sm border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all overflow-hidden",
              isOverdue ? "bg-red-100 text-red-700 border-red-400 ring-1 ring-red-300" :
              status === "done" ? "bg-green-100 text-green-700 border-green-300" :
              status === "in_progress" ? "bg-blue-100 text-blue-700 border-blue-300" :
              status === "in_review" ? "bg-purple-100 text-purple-700 border-purple-300" :
              "bg-gray-100 text-gray-700 border-gray-300"
            )}
            style={{ left: barLeft, width: Math.max(barWidth, dayWidth), minWidth: 0 }}
          >
            <span className="truncate block w-full">{title}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{duration}일 기간 ({startDate ?? "미정"} ~ {dueDate ?? "미정"})</p>
            <div className="space-y-2">
              <Label className="text-xs">시작일</Label>
              <Input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">마감일</Label>
              <Input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => save({ id: taskId, startDate: editStart || undefined, dueDate: editDue || undefined })} disabled={isPending}>
                저장
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(false)}>취소</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
