"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatus } from "@/lib/constants";

interface StatusSelectProps {
  value: string;
  onValueChange: (value: TaskStatus) => void;
  disabled?: boolean;
}

export function StatusSelect({ value, onValueChange, disabled }: StatusSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as TaskStatus)} disabled={disabled}>
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUSES.map((status) => (
          <SelectItem key={status} value={status} className="text-xs">
            {TASK_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
