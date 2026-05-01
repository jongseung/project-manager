"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useServerAction } from "@/hooks/use-server-action";
import { createSprint } from "@/actions/sprint";
import { format, addDays } from "date-fns";

interface SprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function SprintDialog({ open, onOpenChange, projectId }: SprintDialogProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const twoWeeksLater = format(addDays(new Date(), 13), "yyyy-MM-dd");

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(twoWeeksLater);
  const [goal, setGoal] = useState("");

  const { execute, isPending } = useServerAction(
    async (input: unknown) => createSprint(input),
    {
      successMessage: "스프린트가 생성되었습니다",
      onSuccess: () => { setName(""); setStartDate(today); setEndDate(twoWeeksLater); setGoal(""); onOpenChange(false); },
    }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    execute({ projectId, name: name.trim(), startDate, endDate, goalDescription: goal.trim() || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader><DialogTitle>스프린트 만들기</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>스프린트 이름</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint 3 - 이상감지 엔진 POC" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>스프린트 목표</Label>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="이번 스프린트에서 달성하려는 핵심 목표를 적으세요.&#10;예: Rule-based 이상 감지 엔진 완성 + 1대 장비 파일럿 테스트"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">스프린트 Goal은 팀이 집중해야 할 방향을 정합니다. 스프린트 리뷰에서 이 목표 달성 여부를 확인합니다.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>종료일</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground space-y-1 border">
            <p className="font-medium text-foreground">스프린트 진행 순서</p>
            <p>1. <strong>계획</strong> - 백로그 탭에서 이번 스프린트에 수행할 태스크를 선택합니다</p>
            <p>2. <strong>진행</strong> - 스프린트를 시작하고, 칸반보드에서 태스크를 실행합니다</p>
            <p>3. <strong>리뷰</strong> - 스프린트 종료 시 목표 달성 여부를 확인합니다</p>
            <p>4. <strong>회고</strong> - 잘한 점/개선점을 기록하고 다음 스프린트를 계획합니다</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit" disabled={!name.trim() || !startDate || !endDate || isPending}>만들기</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
