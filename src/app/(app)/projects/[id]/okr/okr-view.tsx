"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Target, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { useServerAction } from "@/hooks/use-server-action";
import { createObjective, deleteObjective, createKeyResult, deleteKeyResult, recordKRSnapshot } from "@/actions/objective";

type KRWithSnapshots = {
  id: string;
  title: string;
  metricName: string | null;
  unit: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  direction: string;
  snapshots: { id: string; value: number; note: string | null; recordedAt: Date }[];
  storyLinks: { story: { id: string; title: string; status: string } }[];
};

type ObjectiveWithKRs = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  keyResults: KRWithSnapshots[];
};

interface OKRViewProps {
  projectId: string;
  objectives: ObjectiveWithKRs[];
}

export function OKRView({ projectId, objectives }: OKRViewProps) {
  const [objDialogOpen, setObjDialogOpen] = useState(false);
  const [krDialogOpen, setKRDialogOpen] = useState(false);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [selectedObjId, setSelectedObjId] = useState<string>("");
  const [selectedKR, setSelectedKR] = useState<KRWithSnapshots | null>(null);

  // Objective form
  const [objTitle, setObjTitle] = useState("");
  const [objDesc, setObjDesc] = useState("");

  // KR form
  const [krTitle, setKRTitle] = useState("");
  const [krUnit, setKRUnit] = useState("%");
  const [krStart, setKRStart] = useState(0);
  const [krTarget, setKRTarget] = useState(100);
  const [krDirection, setKRDirection] = useState("increase");

  // Snapshot form
  const [snapValue, setSnapValue] = useState(0);
  const [snapNote, setSnapNote] = useState("");

  const { execute: addObj, isPending: isAddingObj } = useServerAction(
    async (input: unknown) => createObjective(input),
    { successMessage: "목표가 생성되었습니다", onSuccess: () => { setObjDialogOpen(false); setObjTitle(""); setObjDesc(""); } }
  );

  const { execute: removeObj } = useServerAction(
    async (id: string) => deleteObjective(id),
    { successMessage: "목표가 삭제되었습니다" }
  );

  const { execute: addKR, isPending: isAddingKR } = useServerAction(
    async (input: unknown) => createKeyResult(input),
    { successMessage: "핵심 결과가 추가되었습니다", onSuccess: () => setKRDialogOpen(false) }
  );

  const { execute: removeKR } = useServerAction(
    async (id: string) => deleteKeyResult(id),
    { successMessage: "핵심 결과가 삭제되었습니다" }
  );

  const { execute: recordSnap, isPending: isRecording } = useServerAction(
    async (input: { id: string; value: number; note?: string }) => recordKRSnapshot(input.id, input.value, input.note),
    { successMessage: "값이 기록되었습니다", onSuccess: () => setSnapshotDialogOpen(false) }
  );

  function openAddKR(objectiveId: string) {
    setSelectedObjId(objectiveId);
    setKRTitle("");
    setKRUnit("%");
    setKRStart(0);
    setKRTarget(100);
    setKRDirection("increase");
    setKRDialogOpen(true);
  }

  function openSnapshot(kr: KRWithSnapshots) {
    setSelectedKR(kr);
    setSnapValue(kr.currentValue);
    setSnapNote("");
    setSnapshotDialogOpen(true);
  }

  function krProgress(kr: KRWithSnapshots): number {
    const range = Math.abs(kr.targetValue - kr.startValue);
    if (range === 0) return 100;
    const moved = kr.direction === "decrease"
      ? kr.startValue - kr.currentValue
      : kr.currentValue - kr.startValue;
    return Math.max(0, Math.min(100, Math.round((moved / range) * 100)));
  }

  return (
    <>
      <div className="p-6 max-w-full space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{objectives.length} objective{objectives.length !== 1 ? "s" : ""}</span>
          <Button size="sm" onClick={() => setObjDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />새 목표</Button>
        </div>

        {objectives.length === 0 ? (
          <EmptyState
            icon={<Target className="h-12 w-12" />}
            title="목표가 없습니다"
            description="목표와 핵심 결과를 정의하여 프로젝트 성과를 측정하세요."
            action={<Button onClick={() => setObjDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />목표 추가</Button>}
          />
        ) : (
          objectives.map((obj) => (
            <Card key={obj.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      {obj.title}
                    </CardTitle>
                    {obj.description && <CardDescription className="mt-1">{obj.description}</CardDescription>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openAddKR(obj.id)}>
                      <Plus className="h-3.5 w-3.5 mr-1" />KR
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeObj(obj.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {obj.keyResults.map((kr) => {
                  const pct = krProgress(kr);
                  const DirectionIcon = kr.direction === "decrease" ? TrendingDown : kr.direction === "maintain" ? Minus : TrendingUp;
                  return (
                    <div key={kr.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <DirectionIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{kr.title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openSnapshot(kr)}>
                            기록
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeKR(kr.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-yellow-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">
                          {kr.currentValue}{kr.unit} / {kr.targetValue}{kr.unit} ({pct}%)
                        </span>
                      </div>
                      {kr.storyLinks.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {kr.storyLinks.map(({ story }) => (
                            <Badge key={story.id} variant="secondary" className="text-xs">
                              {story.title}
                              {story.status === "done" && " ✓"}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {obj.keyResults.length === 0 && (
                  <p className="text-sm text-muted-foreground">핵심 결과가 없습니다. 추가하여 진행 상황을 추적하세요.</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Objective Dialog */}
      <Dialog open={objDialogOpen} onOpenChange={setObjDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>새 목표</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addObj({ projectId, title: objTitle.trim(), description: objDesc.trim() || undefined }); }} className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input value={objTitle} onChange={(e) => setObjTitle(e.target.value)} placeholder="달성하고 싶은 목표를 입력하세요" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Input value={objDesc} onChange={(e) => setObjDesc(e.target.value)} placeholder="추가 설명 (선택)" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!objTitle.trim() || isAddingObj}>만들기</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Key Result Dialog */}
      <Dialog open={krDialogOpen} onOpenChange={setKRDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>핵심 결과 추가</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addKR({ objectiveId: selectedObjId, title: krTitle.trim(), unit: krUnit, startValue: krStart, currentValue: krStart, targetValue: krTarget, direction: krDirection }); }} className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input value={krTitle} onChange={(e) => setKRTitle(e.target.value)} placeholder="핵심 결과 설명" autoFocus />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>시작값</Label>
                <Input type="number" value={krStart} onChange={(e) => setKRStart(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>목표값</Label>
                <Input type="number" value={krTarget} onChange={(e) => setKRTarget(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>단위</Label>
                <Input value={krUnit} onChange={(e) => setKRUnit(e.target.value)} placeholder="%" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>방향</Label>
              <Select value={krDirection} onValueChange={setKRDirection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">높을수록 좋음</SelectItem>
                  <SelectItem value="decrease">낮을수록 좋음</SelectItem>
                  <SelectItem value="maintain">범위 유지</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!krTitle.trim() || isAddingKR}>만들기</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Snapshot Dialog */}
      <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader><DialogTitle>값 기록</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (selectedKR) recordSnap({ id: selectedKR.id, value: snapValue, note: snapNote.trim() || undefined }); }} className="space-y-4">
            {selectedKR && <p className="text-sm text-muted-foreground">{selectedKR.title}</p>}
            <div className="space-y-2">
              <Label>현재 값</Label>
              <Input type="number" value={snapValue} onChange={(e) => setSnapValue(Number(e.target.value))} autoFocus />
            </div>
            <div className="space-y-2">
              <Label>메모 (선택)</Label>
              <Input value={snapNote} onChange={(e) => setSnapNote(e.target.value)} placeholder="변경 사항" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isRecording}>저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
