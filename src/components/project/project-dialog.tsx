"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useServerAction } from "@/hooks/use-server-action";
import { createProject, updateProject } from "@/actions/project";
import { DEFAULT_COLORS } from "@/lib/constants";
import type { Project } from "@prisma/client";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  project?: Project | null;
}

export function ProjectDialog({ open, onOpenChange, workspaceId, project }: ProjectDialogProps) {
  const isEdit = !!project;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [summary, setSummary] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [definitionOfDone, setDefinitionOfDone] = useState("");
  const [showInception, setShowInception] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? "");
      setColor(project.color);
      setSummary(project.summary ?? "");
      setProblemStatement(project.problemStatement ?? "");
      setDefinitionOfDone(project.definitionOfDone ?? "");
      setShowInception(!!(project.summary || project.problemStatement || project.definitionOfDone));
    } else {
      setName("");
      setDescription("");
      setColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
      setSummary("");
      setProblemStatement("");
      setDefinitionOfDone("");
      setShowInception(false);
    }
  }, [project, open]);

  const { execute: create, isPending: isCreating } = useServerAction(
    async (input: unknown) => createProject(input),
    { successMessage: "프로젝트가 생성되었습니다", onSuccess: () => onOpenChange(false) }
  );

  const { execute: update, isPending: isUpdating } = useServerAction(
    async (input: { id: string; data: unknown }) => updateProject(input.id, input.data),
    { successMessage: "프로젝트가 수정되었습니다", onSuccess: () => onOpenChange(false) }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      workspaceId, name: name.trim(), description: description.trim() || undefined, color,
      summary: summary.trim() || undefined,
      problemStatement: problemStatement.trim() || undefined,
      definitionOfDone: definitionOfDone.trim() || undefined,
    };
    if (isEdit) {
      update({ id: project.id, data });
    } else {
      create(data);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "프로젝트 편집" : "프로젝트 만들기"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proj-name">이름</Label>
            <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="프로젝트 이름" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">설명</Label>
            <Textarea id="proj-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="설명 (선택)" rows={2} />
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

          {/* Inception Fields */}
          {!showInception ? (
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setShowInception(true)}>
              + 전체 기획 (문제, 목표)
            </Button>
          ) : (
            <div className="space-y-3 border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">프로젝트 기획</p>
              <div className="space-y-2">
                <Label>한 줄 요약</Label>
                <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="이 프로젝트를 한 줄로 설명하세요" />
              </div>
              <div className="space-y-2">
                <Label>문제 정의</Label>
                <Textarea value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} placeholder="이 프로젝트를 하는 이유는?" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>완료 기준</Label>
                <Textarea value={definitionOfDone} onChange={(e) => setDefinitionOfDone(e.target.value)} placeholder="성공의 기준은 무엇인가요?" rows={3} />
              </div>
            </div>
          )}

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
