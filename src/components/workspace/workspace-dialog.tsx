"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useServerAction } from "@/hooks/use-server-action";
import { createWorkspace, updateWorkspace } from "@/actions/workspace";
import { DEFAULT_COLORS } from "@/lib/constants";
import type { Workspace } from "@prisma/client";

interface WorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace?: Workspace | null;
}

export function WorkspaceDialog({ open, onOpenChange, workspace }: WorkspaceDialogProps) {
  const isEdit = !!workspace;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setDescription(workspace.description ?? "");
      setColor(workspace.color);
    } else {
      setName("");
      setDescription("");
      setColor(DEFAULT_COLORS[0]);
    }
  }, [workspace, open]);

  const { execute: create, isPending: isCreating } = useServerAction(
    async (input: unknown) => createWorkspace(input),
    { successMessage: "워크스페이스가 생성되었습니다", onSuccess: () => onOpenChange(false) }
  );

  const { execute: update, isPending: isUpdating } = useServerAction(
    async (input: { id: string; data: unknown }) => updateWorkspace(input.id, input.data),
    { successMessage: "워크스페이스가 수정되었습니다", onSuccess: () => onOpenChange(false) }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { name: name.trim(), description: description.trim() || undefined, color };
    if (isEdit) {
      update({ id: workspace.id, data });
    } else {
      create(data);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "워크스페이스 편집" : "워크스페이스 만들기"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ws-name">이름</Label>
            <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="워크스페이스 이름" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-desc">설명</Label>
            <Textarea id="ws-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="설명 (선택)" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>색상</Label>
            <div className="flex gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit" disabled={!name.trim() || isCreating || isUpdating}>
              {isEdit ? "저장" : "만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
