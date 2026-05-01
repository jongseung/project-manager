"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerAction } from "@/hooks/use-server-action";
import { createGoal } from "@/actions/goal";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function GoalDialog({ open, onOpenChange, workspaceId }: GoalDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const { execute, isPending } = useServerAction(
    async (input: unknown) => createGoal(input),
    { successMessage: "목표가 생성되었습니다", onSuccess: () => { setTitle(""); setDescription(""); setTargetDate(""); onOpenChange(false); } }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    execute({ workspaceId, title: title.trim(), description: description.trim() || undefined, targetDate: targetDate || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>목표 만들기</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="목표 제목" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>설명</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="달성하고 싶은 것을 입력하세요" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>목표 날짜</Label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit" disabled={!title.trim() || isPending}>만들기</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
