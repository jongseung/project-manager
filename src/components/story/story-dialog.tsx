"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerAction } from "@/hooks/use-server-action";
import { createStory, updateStory } from "@/actions/story";
import { STORY_POINTS } from "@/lib/constants";
interface StoryLike {
  id: string;
  title: string;
  description: string | null;
  userStory: string | null;
  storyPoints: number | null;
  priority: string;
  epicId?: string | null;
}

interface StoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  epics?: { id: string; name: string }[];
  story?: StoryLike | null;
}

export function StoryDialog({ open, onOpenChange, projectId, epics = [], story }: StoryDialogProps) {
  const isEdit = !!story;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userStory, setUserStory] = useState("");
  const [storyPoints, setStoryPoints] = useState<string>("");
  const [priority, setPriority] = useState("medium");
  const [epicId, setEpicId] = useState("");

  useEffect(() => {
    if (story) {
      setTitle(story.title);
      setDescription(story.description ?? "");
      setUserStory(story.userStory ?? "");
      setStoryPoints(story.storyPoints?.toString() ?? "");
      setPriority(story.priority);
      setEpicId(story.epicId ?? "");
    } else {
      setTitle("");
      setDescription("");
      setUserStory("");
      setStoryPoints("");
      setPriority("medium");
      setEpicId("");
    }
  }, [story, open]);

  const { execute: create, isPending: isCreating } = useServerAction(
    async (input: unknown) => createStory(input),
    { successMessage: "스토리가 생성되었습니다", onSuccess: () => onOpenChange(false) }
  );

  const { execute: update, isPending: isUpdating } = useServerAction(
    async (input: { id: string; data: unknown }) => updateStory(input.id, input.data),
    { successMessage: "스토리가 수정되었습니다", onSuccess: () => onOpenChange(false) }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      projectId,
      epicId: epicId || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      userStory: userStory.trim() || undefined,
      storyPoints: storyPoints ? Number(storyPoints) : undefined,
      priority,
    };
    if (isEdit) {
      update({ id: story.id, data });
    } else {
      create(data);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "스토리 편집" : "새 스토리"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {epics.length > 0 && (
            <div className="space-y-2">
              <Label>소속 에픽</Label>
              <Select value={epicId || "_none"} onValueChange={(val) => setEpicId(val === "_none" ? "" : val)}>
                <SelectTrigger><SelectValue placeholder="에픽 선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">없음</SelectItem>
                  {epics.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">스토리가 속할 상위 에픽을 선택하세요</p>
            </div>
          )}
          <div className="space-y-2">
            <Label>제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="스토리 제목" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>유저 스토리</Label>
            <Textarea
              value={userStory}
              onChange={(e) => setUserStory(e.target.value)}
              placeholder="[역할]로서, [기능]을 원합니다. [이유] 때문에"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>설명</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="상세 내용, 완료 조건..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>스토리 포인트</Label>
              <Select value={storyPoints || "_none"} onValueChange={(val) => setStoryPoints(val === "_none" ? "" : val)}>
                <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">없음</SelectItem>
                  {STORY_POINTS.map((p) => (
                    <SelectItem key={p} value={p.toString()}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>우선순위</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">긴급</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit" disabled={!title.trim() || isCreating || isUpdating}>
              {isEdit ? "저장" : "만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
