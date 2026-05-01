"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServerAction } from "@/hooks/use-server-action";
import { createMilestone } from "@/actions/milestone";

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function MilestoneDialog({ open, onOpenChange, projectId }: MilestoneDialogProps) {
  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const { execute, isPending } = useServerAction(
    async (input: unknown) => createMilestone(input),
    { successMessage: "마일스톤이 생성되었습니다", onSuccess: () => { setName(""); setTargetDate(""); onOpenChange(false); } }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    execute({ projectId, name: name.trim(), targetDate });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader><DialogTitle>Create Milestone</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="v1.0 Release" autoFocus /></div>
          <div className="space-y-2"><Label>Target Date</Label><Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || !targetDate || isPending}>Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
