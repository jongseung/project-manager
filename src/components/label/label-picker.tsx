"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LabelBadge } from "./label-badge";
import { useServerAction } from "@/hooks/use-server-action";
import { createLabel, assignLabel, removeLabel } from "@/actions/label";
import { DEFAULT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LabelPickerProps {
  workspaceId: string;
  taskId: string;
  labels: { id: string; name: string; color: string }[];
  assignedLabelIds: string[];
}

export function LabelPicker({ workspaceId, taskId, labels, assignedLabelIds }: LabelPickerProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);

  const { execute: assign } = useServerAction(
    async (labelId: string) => assignLabel(taskId, labelId)
  );
  const { execute: unassign } = useServerAction(
    async (labelId: string) => removeLabel(taskId, labelId)
  );
  const { execute: create } = useServerAction(
    async (input: unknown) => createLabel(input),
    { successMessage: "라벨이 생성되었습니다", onSuccess: () => setNewName("") }
  );

  function toggleLabel(labelId: string) {
    if (assignedLabelIds.includes(labelId)) {
      unassign(labelId);
    } else {
      assign(labelId);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Labels
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {labels.map((label) => (
            <button
              key={label.id}
              className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-accent"
              onClick={() => toggleLabel(label.id)}
            >
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: label.color }} />
              <span className="flex-1 text-left">{label.name}</span>
              {assignedLabelIds.includes(label.id) && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </div>
        <div className="border-t mt-2 pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim()) create({ workspaceId, name: newName.trim(), color: newColor });
            }}
            className="flex gap-1"
          >
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New label" className="h-7 text-xs flex-1" />
            <Button type="submit" size="sm" className="h-7" disabled={!newName.trim()}>Add</Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
