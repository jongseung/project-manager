"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MoreHorizontal, Play, Pause, Pencil, Trash2, Repeat } from "lucide-react";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteRecurringTemplate, toggleRecurringTemplate, triggerRecurringTemplate } from "@/actions/recurring";
import { RECURRING_FREQUENCY_LABELS, WEEKDAY_LABELS } from "@/lib/constants";
import { PriorityBadge } from "@/components/task/priority-badge";
import { format, formatDistanceToNow } from "date-fns";
import type { RecurringFrequency } from "@/lib/constants";

interface RecurringCardProps {
  template: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    frequency: string;
    interval: number;
    daysOfWeek: string;
    dayOfMonth: number | null;
    timeOfDay: string | null;
    isActive: boolean;
    nextRunAt: Date;
    lastRunAt: Date | null;
    _count: { tasks: number };
  };
  onEdit: () => void;
}

function formatSchedule(freq: string, interval: number, daysOfWeek: string, dayOfMonth: number | null, timeOfDay: string | null): string {
  const parts: string[] = [];
  const freqLabel = RECURRING_FREQUENCY_LABELS[freq as RecurringFrequency] ?? freq;

  if (interval > 1) {
    parts.push(`Every ${interval} ${freqLabel.toLowerCase()}s`);
  } else {
    parts.push(freqLabel);
  }

  const dow: number[] = JSON.parse(daysOfWeek);
  if (dow.length > 0 && (freq === "weekly" || freq === "biweekly")) {
    parts.push(dow.map((d) => WEEKDAY_LABELS[d]).join("/"));
  }

  if (dayOfMonth && (freq === "monthly" || freq === "quarterly")) {
    parts.push(`on the ${dayOfMonth}${dayOfMonth === 1 ? "st" : dayOfMonth === 2 ? "nd" : dayOfMonth === 3 ? "rd" : "th"}`);
  }

  if (timeOfDay) {
    parts.push(`at ${timeOfDay}`);
  }

  return parts.join(" · ");
}

export function RecurringCard({ template, onEdit }: RecurringCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { execute: toggle } = useServerAction(
    async () => toggleRecurringTemplate(template.id, !template.isActive),
    { successMessage: template.isActive ? "루틴이 일시정지되었습니다" : "루틴이 재개되었습니다" }
  );

  const { execute: trigger, isPending: isTriggering } = useServerAction(
    async () => triggerRecurringTemplate(template.id),
    { successMessage: "루틴에서 태스크가 생성되었습니다" }
  );

  const schedule = formatSchedule(template.frequency, template.interval, template.daysOfWeek, template.dayOfMonth, template.timeOfDay);
  return (
    <Card className={!template.isActive ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Repeat className={`h-4 w-4 shrink-0 ${template.isActive ? "text-green-500" : "text-muted-foreground"}`} />
            <CardTitle className="text-sm truncate">{template.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => trigger(undefined)} disabled={isTriggering || !template.isActive} title="Run now">
              <Play className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggle(undefined)}>
                  {template.isActive ? <><Pause className="h-3.5 w-3.5 mr-2" />Pause</> : <><Play className="h-3.5 w-3.5 mr-2" />Resume</>}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); setConfirmOpen(true); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={`"${template.title}" 루틴을 삭제할까요?`}
          description={`이미 생성된 태스크 ${template._count.tasks}개는 유지됩니다. 루틴 설정만 삭제됩니다.`}
          successMessage="루틴이 삭제되었습니다"
          onConfirm={() => deleteRecurringTemplate(template.id)}
        />
        {template.description && <CardDescription className="text-xs mt-1">{template.description}</CardDescription>}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <PriorityBadge priority={template.priority} />
          <span className="text-xs text-muted-foreground">{schedule}</span>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Next: {format(new Date(template.nextRunAt), "MMM d, HH:mm")}</span>
          <span>{template._count.tasks} tasks created</span>
        </div>
        {template.lastRunAt && (
          <span className="text-xs text-muted-foreground">Last run: {formatDistanceToNow(new Date(template.lastRunAt), { addSuffix: true })}</span>
        )}
      </CardHeader>
    </Card>
  );
}
