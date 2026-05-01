"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerAction } from "@/hooks/use-server-action";
import { createRecurringTemplate, updateRecurringTemplate } from "@/actions/recurring";
import { RECURRING_FREQUENCIES, RECURRING_FREQUENCY_LABELS, WEEKDAY_LABELS, TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/constants";
import { Plus, X } from "lucide-react";

interface RecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  projects: { id: string; name: string }[];
  members: { id: string; name: string }[];
  template?: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    frequency: string;
    interval: number;
    daysOfWeek: string;
    dayOfMonth: number | null;
    timeOfDay: string | null;
    projectId: string | null;
    memberId: string | null;
    subtaskTemplates: { id: string; title: string }[];
  } | null;
}

export function RecurringDialog({ open, onOpenChange, workspaceId, projects, members, template }: RecurringDialogProps) {
  const isEdit = !!template;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [frequency, setFrequency] = useState("daily");
  const [interval, setInterval] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(null);
  const [timeOfDay, setTimeOfDay] = useState("09:00");
  const [projectId, setProjectId] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description ?? "");
      setPriority(template.priority);
      setFrequency(template.frequency);
      setInterval(template.interval);
      setDaysOfWeek(JSON.parse(template.daysOfWeek));
      setDayOfMonth(template.dayOfMonth);
      setTimeOfDay(template.timeOfDay ?? "09:00");
      setProjectId(template.projectId ?? "");
      setMemberId(template.memberId ?? "");
      setSubtasks(template.subtaskTemplates.map((s) => s.title));
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setFrequency("daily");
      setInterval(1);
      setDaysOfWeek([]);
      setDayOfMonth(null);
      setTimeOfDay("09:00");
      setProjectId(projects[0]?.id ?? "");
      setMemberId("");
      setSubtasks([]);
    }
    setNewSubtask("");
  }, [template, open, projects]);

  const { execute: create, isPending: isCreating } = useServerAction(
    async (input: unknown) => createRecurringTemplate(input),
    { successMessage: "루틴이 생성되었습니다", onSuccess: () => onOpenChange(false) }
  );

  const { execute: update, isPending: isUpdating } = useServerAction(
    async (input: unknown) => updateRecurringTemplate(input),
    { successMessage: "루틴이 수정되었습니다", onSuccess: () => onOpenChange(false) }
  );

  function toggleDay(day: number) {
    setDaysOfWeek((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  }

  function addSubtask() {
    if (newSubtask.trim()) {
      setSubtasks((prev) => [...prev, newSubtask.trim()]);
      setNewSubtask("");
    }
  }

  function removeSubtask(index: number) {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      workspaceId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      frequency,
      interval,
      daysOfWeek,
      dayOfMonth: frequency === "monthly" || frequency === "quarterly" ? dayOfMonth : undefined,
      timeOfDay: timeOfDay || undefined,
      projectId: projectId || undefined,
      memberId: memberId || undefined,
      subtasks: subtasks.map((t) => ({ title: t })),
    };

    if (isEdit) {
      update({ id: template.id, ...data });
    } else {
      create(data);
    }
  }

  const isPending = isCreating || isUpdating;
  const showDaysOfWeek = frequency === "weekly" || frequency === "biweekly";
  const showDayOfMonth = frequency === "monthly" || frequency === "quarterly";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "루틴 편집" : "새 루틴"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rt-title">제목</Label>
            <Input id="rt-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="데일리 스크럼 체크" autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rt-desc">설명</Label>
            <Textarea id="rt-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="설명 (선택)" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>반복 주기</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRING_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>{RECURRING_FREQUENCY_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>간격</Label>
              <Input type="number" min={1} max={99} value={interval} onChange={(e) => setInterval(Number(e.target.value) || 1)} />
            </div>
          </div>

          {showDaysOfWeek && (
            <div className="space-y-2">
              <Label>요일</Label>
              <div className="flex gap-1">
                {WEEKDAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`h-8 w-10 rounded text-xs font-medium transition-colors ${
                      daysOfWeek.includes(i)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showDayOfMonth && (
            <div className="space-y-2">
              <Label>날짜 (월 중)</Label>
              <Input type="number" min={1} max={31} value={dayOfMonth ?? ""} onChange={(e) => setDayOfMonth(e.target.value ? Number(e.target.value) : null)} placeholder="15" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>시간</Label>
              <Input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>우선순위</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.filter((p) => p !== "none").map((p) => (
                    <SelectItem key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>프로젝트</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="프로젝트 선택" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>담당자</Label>
              <Select value={memberId || "_none"} onValueChange={(val) => setMemberId(val === "_none" ? "" : val)}>
                <SelectTrigger><SelectValue placeholder="미배정" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">미배정</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>서브태스크 템플릿</Label>
            {subtasks.map((st, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm bg-muted rounded px-2 py-1">{st}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSubtask(i)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="서브태스크 추가..."
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); addSubtask(); } }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addSubtask} disabled={!newSubtask.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit" disabled={!title.trim() || !projectId || isPending}>
              {isEdit ? "저장" : "만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
