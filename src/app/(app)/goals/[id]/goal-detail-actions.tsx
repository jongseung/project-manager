"use client";

import { useState } from "react";
import { Plus, X, Link2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPICard } from "@/components/kpi/kpi-card";
import { KPITrendChart } from "@/components/kpi/kpi-trend-chart";
import { KPISparkline } from "@/components/kpi/kpi-sparkline";
import { useServerAction } from "@/hooks/use-server-action";
import { linkProjectToGoal, unlinkProjectFromGoal } from "@/actions/goal";
import { createKPI, recordKPIEntry } from "@/actions/kpi";

interface GoalDetailActionsProps {
  goalId: string;
  linkedProjects: { id: string; name: string }[];
  availableProjects: { id: string; name: string }[];
  kpis: {
    id: string;
    name: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    direction: string;
    entries: { value: number; recordedAt: Date }[];
  }[];
}

export function GoalDetailActions({ goalId, linkedProjects, availableProjects, kpis }: GoalDetailActionsProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [selectedKpiId, setSelectedKpiId] = useState<string>("");

  // Link project
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const { execute: link } = useServerAction(
    async (projectId: string) => linkProjectToGoal(goalId, projectId),
    { successMessage: "프로젝트가 연결되었습니다", onSuccess: () => { setSelectedProjectId(""); setLinkDialogOpen(false); } }
  );
  const { execute: unlink } = useServerAction(
    async (projectId: string) => unlinkProjectFromGoal(goalId, projectId),
    { successMessage: "프로젝트 연결이 해제되었습니다" }
  );

  // Create KPI
  const [kpiName, setKpiName] = useState("");
  const [kpiUnit, setKpiUnit] = useState("%");
  const [kpiTarget, setKpiTarget] = useState("");
  const [kpiDirection, setKpiDirection] = useState("increase");
  const { execute: addKpi } = useServerAction(
    async (input: unknown) => createKPI(input),
    { successMessage: "KPI가 생성되었습니다", onSuccess: () => { setKpiName(""); setKpiTarget(""); setKpiDialogOpen(false); } }
  );

  // Record KPI entry
  const [entryValue, setEntryValue] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const { execute: recordEntry } = useServerAction(
    async (input: { kpiId: string; value: number; note?: string }) => recordKPIEntry(input.kpiId, input.value, input.note),
    { successMessage: "기록이 저장되었습니다", onSuccess: () => { setEntryValue(""); setEntryNote(""); setEntryDialogOpen(false); } }
  );

  return (
    <>
      {/* Linked Projects */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">연결된 프로젝트</h2>
          {availableProjects.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setLinkDialogOpen(true)}>
              <Link2 className="h-3.5 w-3.5 mr-1" /> 프로젝트 연결
            </Button>
          )}
        </div>
        {linkedProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">연결된 프로젝트가 없습니다. 프로젝트를 연결하여 진행 상황을 추적하세요.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {linkedProjects.map((project) => (
              <Badge key={project.id} variant="outline" className="gap-1 pr-1">
                {project.name}
                <button onClick={() => unlink(project.id)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* KPIs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">KPIs</h2>
          <Button size="sm" variant="outline" onClick={() => setKpiDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> KPI 추가
          </Button>
        </div>
        {kpis.length === 0 ? (
          <p className="text-sm text-muted-foreground">KPI가 없습니다. KPI를 추가하여 진행률을 측정하세요.</p>
        ) : (
          <div className="space-y-6">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <KPICard name={kpi.name} currentValue={kpi.currentValue} targetValue={kpi.targetValue} unit={kpi.unit} direction={kpi.direction} />
                  </div>
                  <KPISparkline entries={kpi.entries} direction={kpi.direction} targetValue={kpi.targetValue} />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedKpiId(kpi.id); setEntryDialogOpen(true); }}>
                    <BarChart3 className="h-3.5 w-3.5 mr-1" /> 기록 추가
                  </Button>
                </div>
                <KPITrendChart entries={kpi.entries} targetValue={kpi.targetValue} unit={kpi.unit} direction={kpi.direction} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Link Project Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>프로젝트 연결</DialogTitle></DialogHeader>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger><SelectValue placeholder="프로젝트 선택" /></SelectTrigger>
            <SelectContent>
              {availableProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>취소</Button>
            <Button disabled={!selectedProjectId} onClick={() => link(selectedProjectId)}>연결</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create KPI Dialog */}
      <Dialog open={kpiDialogOpen} onOpenChange={setKpiDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>KPI 추가</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addKpi({ goalId, name: kpiName.trim(), unit: kpiUnit, targetValue: parseFloat(kpiTarget), direction: kpiDirection }); }} className="space-y-4">
            <div className="space-y-2"><Label>이름</Label><Input value={kpiName} onChange={(e) => setKpiName(e.target.value)} placeholder="태스크 완료율" autoFocus /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>목표값</Label><Input type="number" value={kpiTarget} onChange={(e) => setKpiTarget(e.target.value)} placeholder="100" /></div>
              <div className="space-y-2"><Label>단위</Label><Input value={kpiUnit} onChange={(e) => setKpiUnit(e.target.value)} placeholder="%" /></div>
            </div>
            <div className="space-y-2">
              <Label>방향</Label>
              <Select value={kpiDirection} onValueChange={setKpiDirection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">높을수록 좋음</SelectItem>
                  <SelectItem value="decrease">낮을수록 좋음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setKpiDialogOpen(false)}>취소</Button>
              <Button type="submit" disabled={!kpiName.trim() || !kpiTarget}>생성</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record KPI Entry Dialog */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader><DialogTitle>KPI 기록 추가</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); recordEntry({ kpiId: selectedKpiId, value: parseFloat(entryValue), note: entryNote.trim() || undefined }); }} className="space-y-4">
            <div className="space-y-2"><Label>값</Label><Input type="number" step="any" value={entryValue} onChange={(e) => setEntryValue(e.target.value)} placeholder="75" autoFocus /></div>
            <div className="space-y-2"><Label>메모 (선택)</Label><Input value={entryNote} onChange={(e) => setEntryNote(e.target.value)} placeholder="주간 리뷰" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEntryDialogOpen(false)}>취소</Button>
              <Button type="submit" disabled={!entryValue}>기록</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
