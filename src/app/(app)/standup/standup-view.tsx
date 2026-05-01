"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, Circle, AlertTriangle, Clock, Zap, TrendingUp,
  Users, FolderKanban, Plus, Play, Square, Timer, Save,
  CalendarClock, UserPlus, ArrowUpRight, Trash2, Activity,
  UserX, ClipboardList,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { updateTask, createTask } from "@/actions/task";
import { saveStandupNote, toggleMeetingTimer } from "@/actions/standup";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { differenceInDays, parseISO, differenceInSeconds, format } from "date-fns";

// ─── Types ───
interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  project: { id: string; name: string; color: string };
  member: { name: string } | null;
}

interface MeetingAction {
  id: string;
  type: "complete" | "extend" | "reassign" | "escalate" | "create" | "dismiss";
  taskTitle: string;
  detail: string;
  timestamp: string;
}

interface ActionItem {
  id: string;
  text: string;
  projectId?: string;
  taskId?: string;
  done: boolean;
}

interface RetroData {
  good: string;
  improve: string;
  action: string;
}

interface StandupData {
  date: string;
  yesterday: TaskItem[];
  todayDue: TaskItem[];
  inProgress: TaskItem[];
  overdue: TaskItem[];
  recentMilestones: { id: string; name: string; project: { name: string } }[];
  projectProgress: { id: string; name: string; color: string; total: number; done: number; recentlyDone: number; progress: number }[];
  sprintSummary: { id: string; name: string; projectName: string; total: number; done: number; endDate: string }[];
  notes: {
    yesterday: string | null;
    today: string | null;
    blockers: string | null;
    actionItems: string | null;
    retro: string | null;
    meetingStartedAt: Date | null;
    meetingEndedAt: Date | null;
  } | null;
  yesterdayActivity: number;
}

// ─── Meeting Timer ───
function MeetingTimer({ startedAt, endedAt, date }: { startedAt: Date | null; endedAt: Date | null; date: string }) {
  const [elapsed, setElapsed] = useState(0);
  const isRunning = !!startedAt && !endedAt;

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt);
    if (endedAt) { setElapsed(differenceInSeconds(new Date(endedAt), start)); return; }
    const tick = () => setElapsed(differenceInSeconds(new Date(), start));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, endedAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  async function handleToggle() {
    if (isRunning) {
      await toggleMeetingTimer(date, "end");
      toast.success("회의가 종료되었습니다");
    } else {
      await toggleMeetingTimer(date, "start");
      toast.success("회의가 시작되었습니다");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant={isRunning ? "destructive" : "default"} onClick={handleToggle} className="h-8 text-xs gap-1.5">
        {isRunning ? <><Square className="h-3 w-3" />회의 종료</> : endedAt ? <><Play className="h-3 w-3" />재시작</> : <><Play className="h-3 w-3" />회의 시작</>}
      </Button>
      {(startedAt || endedAt) && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="h-3 w-3" />
          <span className={cn("font-mono", isRunning && "text-primary font-medium")}>{mins}:{secs.toString().padStart(2, "0")}</span>
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───
function SectionHeader({ number, icon: Icon, title, count, className }: {
  number: number; icon: typeof Clock; title: string; count?: number; className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 mb-3", className)}>
      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{number}</div>
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <h3 className="text-sm font-semibold">{title}</h3>
      {count !== undefined && <span className="text-xs text-muted-foreground">{count}건</span>}
    </div>
  );
}

// ─── Task Row with Actions ───
function ActionableTaskRow({ task, actions, onAction, members }: {
  task: TaskItem;
  actions: MeetingAction[];
  onAction: (action: MeetingAction) => void;
  members?: { id: string; name: string }[];
}) {
  const isDone = task.status === "done";
  const hasAction = actions.some((a) => a.taskTitle === task.title);
  const [extendOpen, setExtendOpen] = useState(false);
  const [newDate, setNewDate] = useState(task.dueDate ?? format(new Date(), "yyyy-MM-dd"));

  async function handleComplete() {
    await updateTask({ id: task.id, status: "done" });
    onAction({ id: crypto.randomUUID(), type: "complete", taskTitle: task.title, detail: "완료 처리", timestamp: new Date().toISOString() });
    toast.success("완료 처리됨");
  }

  async function handleExtend() {
    await updateTask({ id: task.id, dueDate: newDate });
    onAction({ id: crypto.randomUUID(), type: "extend", taskTitle: task.title, detail: `마감일 → ${newDate}`, timestamp: new Date().toISOString() });
    setExtendOpen(false);
    toast.success("마감일이 변경되었습니다");
  }

  const PRIORITY_UP: Record<string, string> = { none: "low", low: "medium", medium: "high", high: "urgent" };

  async function handlePriorityUp() {
    const next = PRIORITY_UP[task.priority];
    if (!next) { toast.error("이미 최고 우선순위입니다"); return; }
    await updateTask({ id: task.id, priority: next });
    onAction({ id: crypto.randomUUID(), type: "escalate", taskTitle: task.title, detail: `우선순위 상향 ${task.priority} → ${next}`, timestamp: new Date().toISOString() });
    toast.success("우선순위가 상향되었습니다");
  }

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors group",
      hasAction && "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900",
      !hasAction && "hover:bg-accent/30"
    )}>
      {/* 완료 토글 */}
      <button onClick={handleComplete} className="shrink-0" disabled={isDone}>
        {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary" />}
      </button>

      {/* 프로젝트 색상 dot */}
      <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: task.project.color }} />

      {/* 제목 + 메타 */}
      <div className="flex-1 min-w-0">
        <span className={cn("truncate block", isDone && "line-through text-muted-foreground")}>{task.title}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{task.project.name}</span>
          {task.member && <span className="text-[10px] text-muted-foreground">· {task.member.name}</span>}
          {task.dueDate && <span className="text-[10px] text-muted-foreground">· {task.dueDate}</span>}
        </div>
      </div>

      {/* 액션 버튼들 — hover 시 표시 */}
      {!isDone && (
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 마감 연장 */}
          <Popover open={extendOpen} onOpenChange={setExtendOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="마감 연장">
                <CalendarClock className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="end">
              <p className="text-xs font-medium mb-2">마감일 변경</p>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-7 text-xs mb-2" />
              <Button size="sm" className="w-full h-7 text-xs" onClick={handleExtend}>변경</Button>
            </PopoverContent>
          </Popover>

          {/* 우선순위 상향 */}
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="우선순위 상향" onClick={handlePriorityUp} disabled={task.priority === "urgent"}>
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* 처리됨 표시 */}
      {hasAction && (
        <Badge variant="outline" className="text-[10px] h-4 text-green-600 border-green-200 shrink-0">처리됨</Badge>
      )}
    </div>
  );
}

// ─── Main View ───
export function StandupView({ data }: { data: StandupData }) {
  const [meetingActions, setMeetingActions] = useState<MeetingAction[]>([]);
  const [saving, setSaving] = useState(false);

  // Action items (from insights)
  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    try { return data.notes?.actionItems ? JSON.parse(data.notes.actionItems) : []; } catch { return []; }
  });
  const [newActionText, setNewActionText] = useState("");
  const [newActionProject, setNewActionProject] = useState("");

  // Retro
  const [retro, setRetro] = useState<RetroData>(() => {
    try { return data.notes?.retro ? JSON.parse(data.notes.retro) : { good: "", improve: "", action: "" }; } catch { return { good: "", improve: "", action: "" }; }
  });

  const [viewMode, setViewMode] = useState<"member" | "project">("member");

  const allToday = [...data.todayDue, ...data.inProgress];
  const totalToday = allToday.length;

  // ─── Auto-insights ───
  type Insight = { id: string; icon: typeof AlertTriangle; type: "warning" | "info" | "action"; message: string; taskTitle?: string; projectId?: string };
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  const insights: Insight[] = [];
  data.overdue.forEach((t) => {
    insights.push({ id: `overdue-${t.id}`, icon: AlertTriangle, type: "warning", message: `${t.title} — 마감 지연 (${t.member?.name ?? "미배정"})`, taskTitle: t.title, projectId: t.project.id });
  });
  data.todayDue.filter((t) => !t.member).forEach((t) => {
    insights.push({ id: `unassigned-${t.id}`, icon: UserX, type: "action", message: `${t.title} — 오늘 마감인데 담당자 미배정`, taskTitle: t.title, projectId: t.project.id });
  });
  const yesterdayMembers = new Set(data.yesterday.map((t) => t.member?.name).filter(Boolean));
  const todayMembers = new Set(allToday.map((t) => t.member?.name).filter(Boolean));
  todayMembers.forEach((name) => {
    if (name && !yesterdayMembers.has(name)) {
      insights.push({ id: `no-progress-${name}`, icon: ClipboardList, type: "info", message: `${name} — 어제 완료 태스크 없음, 상황 확인 필요` });
    }
  });
  data.sprintSummary.forEach((s) => {
    const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
    const daysLeft = Math.max(0, differenceInDays(parseISO(s.endDate), new Date()) + 1);
    const timePct = Math.round(((14 - daysLeft) / 14) * 100);
    if (timePct > pct + 20) {
      insights.push({ id: `sprint-risk-${s.id}`, icon: Activity, type: "warning", message: `${s.name} — 스프린트 지연 위험 (진행 ${pct}% vs 시간 ${timePct}%)` });
    }
  });

  const visibleInsights = insights.filter((i) => !dismissedInsights.has(i.id));

  function dismissInsight(id: string) {
    setDismissedInsights((prev) => new Set([...prev, id]));
    const insight = insights.find((i) => i.id === id);
    if (insight) {
      setMeetingActions((prev) => [...prev, { id: crypto.randomUUID(), type: "dismiss", taskTitle: insight.taskTitle ?? "", detail: `인사이트 확인: ${insight.message}`, timestamp: new Date().toISOString() }]);
    }
  }

  function insightToAction(insight: Insight) {
    setActionItems((prev) => [...prev, { id: crypto.randomUUID(), text: insight.message, projectId: insight.projectId, done: false }]);
    dismissInsight(insight.id);
    toast.success("액션 아이템에 추가됨");
  }

  function addMeetingAction(action: MeetingAction) {
    setMeetingActions((prev) => [...prev, action]);
  }

  // Grouping
  function groupByMember(tasks: TaskItem[]) {
    const map = new Map<string, TaskItem[]>();
    tasks.forEach((t) => { const k = t.member?.name ?? "미배정"; if (!map.has(k)) map.set(k, []); map.get(k)!.push(t); });
    return map;
  }

  const todayByMember = groupByMember(allToday);
  const overdueByMember = groupByMember(data.overdue);
  const allMemberNames = new Set<string>();
  [todayByMember, overdueByMember].forEach((m) => m.forEach((_, k) => allMemberNames.add(k)));

  // Action items
  function addActionItem() {
    if (!newActionText.trim()) return;
    setActionItems((prev) => [...prev, { id: crypto.randomUUID(), text: newActionText.trim(), projectId: newActionProject || undefined, done: false }]);
    setNewActionText("");
  }

  async function convertToTask(item: ActionItem) {
    if (!item.projectId) { toast.error("프로젝트를 선택해주세요"); return; }
    const res = await createTask({ projectId: item.projectId, title: item.text, status: "todo", priority: "medium" });
    if (res.success) {
      setActionItems((prev) => prev.map((a) => a.id === item.id ? { ...a, taskId: res.data.id, done: true } : a));
      setMeetingActions((prev) => [...prev, { id: crypto.randomUUID(), type: "create", taskTitle: item.text, detail: "태스크 생성됨", timestamp: new Date().toISOString() }]);
      toast.success("태스크가 생성되었습니다");
    }
  }

  // Auto-generate report from meeting actions
  function generateReport(): string {
    if (meetingActions.length === 0) return "";
    const lines = meetingActions.map((a) => {
      const time = format(new Date(a.timestamp), "HH:mm");
      switch (a.type) {
        case "complete": return `[${time}] ✓ ${a.taskTitle} — ${a.detail}`;
        case "extend": return `[${time}] ◷ ${a.taskTitle} — ${a.detail}`;
        case "escalate": return `[${time}] ↗ ${a.taskTitle} — ${a.detail}`;
        case "create": return `[${time}] + ${a.taskTitle} — ${a.detail}`;
        case "dismiss": return `[${time}] ◇ ${a.detail}`;
        default: return `[${time}] ${a.taskTitle} — ${a.detail}`;
      }
    });
    return lines.join("\n");
  }

  async function handleSave() {
    setSaving(true);
    const report = generateReport();
    const res = await saveStandupNote(data.date, {
      yesterday: report || undefined,
      today: undefined,
      blockers: undefined,
      actionItems: actionItems.length > 0 ? JSON.stringify(actionItems) : undefined,
      retro: (retro.good || retro.improve || retro.action) ? JSON.stringify(retro) : undefined,
    });
    setSaving(false);
    if (res.success) toast.success("스크럼이 저장되었습니다");
    else toast.error(res.error);
  }

  const projects = data.projectProgress;

  return (
    <div className="space-y-6">
      {/* 타이머 + 요약 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <MeetingTimer startedAt={data.notes?.meetingStartedAt ?? null} endedAt={data.notes?.meetingEndedAt ?? null} date={data.date} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>어제 완료 <strong className="text-foreground">{data.yesterday.length}</strong></span>
          <span>오늘 진행 <strong className="text-foreground">{totalToday}</strong></span>
          {data.overdue.length > 0 && <span className="text-red-500">지연 <strong>{data.overdue.length}</strong></span>}
          {meetingActions.length > 0 && <span className="text-green-600">결정 <strong>{meetingActions.length}</strong></span>}
        </div>
      </div>

      {/* ───── 섹션 1: 어제 리뷰 (자동, 쓰기 없음) ───── */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader number={1} icon={CheckCircle2} title="어제 완료" count={data.yesterday.length} />
          {data.yesterday.length > 0 ? (
            <div className="space-y-1">
              {data.yesterday.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-xs py-1 px-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: t.project.color }} />
                  <span className="flex-1 truncate">{t.title}</span>
                  {t.member && <span className="text-[10px] text-muted-foreground">{t.member.name}</span>}
                  <span className="text-[10px] text-muted-foreground">{t.project.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">어제 완료된 태스크가 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* ───── 섹션 2: 오늘 현황 (액션 버튼) ───── */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader number={2} icon={Clock} title="오늘 현황" count={totalToday} className="mb-0" />
            <div className="flex items-center gap-1">
              <button onClick={() => setViewMode("member")} className={cn("flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors", viewMode === "member" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <Users className="h-3 w-3" /> 팀원별
              </button>
              <button onClick={() => setViewMode("project")} className={cn("flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors", viewMode === "project" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <FolderKanban className="h-3 w-3" /> 프로젝트별
              </button>
            </div>
          </div>

          {viewMode === "member" ? (
            <div className="space-y-4">
              {Array.from(allMemberNames).sort().map((name) => {
                const memberTasks = [...(overdueByMember.get(name) ?? []), ...(todayByMember.get(name) ?? [])];
                if (memberTasks.length === 0) return null;
                const overdueCount = overdueByMember.get(name)?.length ?? 0;
                return (
                  <div key={name}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold">{name}</span>
                      <span className="text-[10px] text-muted-foreground">{memberTasks.length}건</span>
                      {overdueCount > 0 && <Badge variant="destructive" className="text-[10px] h-4">지연 {overdueCount}</Badge>}
                    </div>
                    <div className="space-y-1">
                      {memberTasks.map((t) => (
                        <ActionableTaskRow key={t.id} task={t} actions={meetingActions} onAction={addMeetingAction} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((p) => {
                const projectTasks = allToday.filter((t) => t.project.id === p.id);
                const projectOverdue = data.overdue.filter((t) => t.project.id === p.id);
                const all = [...projectOverdue, ...projectTasks];
                if (all.length === 0) return null;
                return (
                  <div key={p.id}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-xs font-semibold">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground">{p.progress}%</span>
                    </div>
                    <div className="space-y-1">
                      {all.map((t) => (
                        <ActionableTaskRow key={t.id} task={t} actions={meetingActions} onAction={addMeetingAction} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ───── 섹션 3: 인사이트 (자동 감지, 쓰기 없음) ───── */}
      {visibleInsights.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardContent className="pt-5">
            <SectionHeader number={3} icon={AlertTriangle} title="인사이트" count={visibleInsights.length} />
            <div className="space-y-1.5">
              {visibleInsights.map((insight) => (
                <div key={insight.id} className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                  insight.type === "warning" && "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30",
                  insight.type === "action" && "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/30",
                  insight.type === "info" && "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30",
                )}>
                  <insight.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{insight.message}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {insight.taskTitle && (
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] text-primary" onClick={() => insightToAction(insight)}>
                        <Zap className="h-2.5 w-2.5 mr-0.5" />액션
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-muted-foreground" onClick={() => dismissInsight(insight.id)}>
                      확인
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ───── 섹션 4: 액션 아이템 ───── */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader number={visibleInsights.length > 0 ? 4 : 3} icon={Zap} title="액션 아이템" count={actionItems.length} />

          {actionItems.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {actionItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs">
                  {item.taskId ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />}
                  <span className={cn("flex-1", item.taskId && "line-through text-muted-foreground")}>{item.text}</span>
                  {!item.taskId && (
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-primary" onClick={() => convertToTask(item)}>
                      태스크 생성
                    </Button>
                  )}
                  {item.taskId && <Badge variant="outline" className="text-[10px] h-4 text-green-600">생성됨</Badge>}
                  <button onClick={() => setActionItems((prev) => prev.filter((a) => a.id !== item.id))} className="text-muted-foreground/40 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input value={newActionText} onChange={(e) => setNewActionText(e.target.value)} placeholder="새 액션 아이템..." className="flex-1 h-8 text-xs"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); addActionItem(); } }} />
            <Select value={newActionProject} onValueChange={setNewActionProject}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="프로젝트" /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8" onClick={addActionItem} disabled={!newActionText.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ───── 섹션 5: 미팅 회고 ───── */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader number={visibleInsights.length > 0 ? 5 : 4} icon={TrendingUp} title="미팅 회고" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-green-600">잘한 점</p>
              <Textarea value={retro.good} onChange={(e) => setRetro((r) => ({ ...r, good: e.target.value }))} placeholder="팀이 잘한 일, 성과" className="text-xs min-h-[70px]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-yellow-600">개선할 점</p>
              <Textarea value={retro.improve} onChange={(e) => setRetro((r) => ({ ...r, improve: e.target.value }))} placeholder="아쉬운 점, 프로세스 개선" className="text-xs min-h-[70px]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-blue-600">다음 액션</p>
              <Textarea value={retro.action} onChange={(e) => setRetro((r) => ({ ...r, action: e.target.value }))} placeholder="다음까지 반영할 액션" className="text-xs min-h-[70px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 회의 중 결정 로그 (자동 생성) */}
      {meetingActions.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">회의 결정 로그</h3>
              <span className="text-xs text-muted-foreground">{meetingActions.length}건 — 자동 생성</span>
            </div>
            <div className="space-y-1 text-xs font-mono bg-muted/50 rounded-lg p-3">
              {meetingActions.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground w-12 shrink-0">{format(new Date(a.timestamp), "HH:mm")}</span>
                  <span className={cn(
                    a.type === "complete" && "text-green-600",
                    a.type === "extend" && "text-yellow-600",
                    a.type === "escalate" && "text-red-600",
                    a.type === "create" && "text-blue-600",
                    a.type === "dismiss" && "text-muted-foreground",
                  )}>
                    {a.type === "complete" && "✓"} {a.type === "extend" && "◷"} {a.type === "escalate" && "↗"} {a.type === "create" && "+"} {a.type === "dismiss" && "◇"}
                  </span>
                  <span className="flex-1">{a.taskTitle ? `${a.taskTitle} — ` : ""}{a.detail}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 스프린트/프로젝트 진행률 */}
      {(data.sprintSummary.length > 0 || data.projectProgress.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.sprintSummary.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />활성 스프린트</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.sprintSummary.map((s) => {
                  const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                  const daysLeft = Math.max(0, differenceInDays(parseISO(s.endDate), new Date()) + 1);
                  return (
                    <div key={s.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs"><span className="font-medium">{s.name}</span><span className={cn("text-muted-foreground", daysLeft <= 3 && "text-red-500 font-medium")}>{daysLeft}일 남음</span></div>
                      <div className="flex items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} /></div><span className="text-[10px] text-muted-foreground">{s.done}/{s.total}</span></div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
          {data.projectProgress.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-purple-500" />프로젝트 진행률</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.projectProgress.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs flex-1 truncate">{p.name}</span>
                    {p.recentlyDone > 0 && <span className="text-[10px] text-green-600">+{p.recentlyDone}</span>}
                    <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }} /></div>
                    <span className="text-[10px] w-7 text-right">{p.progress}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 저장 버튼 — 하단 중앙 고정 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button size="lg" onClick={handleSave} disabled={saving} className="h-12 px-8 text-base font-semibold shadow-2xl gap-2 hover:scale-105 transition-transform">
          <Save className="h-5 w-5" />
          {saving ? "저장 중..." : "스크럼 저장"}
        </Button>
      </div>
      <div className="h-16" />
    </div>
  );
}
