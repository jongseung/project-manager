"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalDialog } from "@/components/goal/goal-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function GoalActions() {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [selectedWs, setSelectedWs] = useState("");

  useEffect(() => {
    fetch("/api/workspaces").then((r) => r.json()).then((data) => {
      setWorkspaces(data);
      if (data.length > 0) setSelectedWs(data[0].id);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex gap-2">
      {workspaces.length > 0 && (
        <Select value={selectedWs} onValueChange={setSelectedWs}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="워크스페이스" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((ws) => (
              <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button size="sm" onClick={() => setOpen(true)} disabled={!selectedWs}>
        <Plus className="h-4 w-4 mr-1" /> 새 목표
      </Button>
      {selectedWs && <GoalDialog open={open} onOpenChange={setOpen} workspaceId={selectedWs} />}
    </div>
  );
}
