"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, CalendarDays, X, AlertTriangle, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { updateTask } from "@/actions/task";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectName: string;
  projectColor: string;
}

interface WidgetData {
  overdue: TaskItem[];
  dueToday: TaskItem[];
  upcoming: TaskItem[];
  inProgress: TaskItem[];
  doneToday: TaskItem[];
}

type Tab = "today" | "reminders";

function TaskRow({ task, onToggle, showDate }: { task: TaskItem; onToggle: (id: string, status: string) => void; showDate?: boolean }) {
  const isDone = task.status === "done";
  return (
    <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent/50 group">
      <button onClick={() => onToggle(task.id, isDone ? "todo" : "done")} className="shrink-0">
        {isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Circle className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-medium truncate", isDone && "line-through text-muted-foreground")}>{task.title}</p>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: task.projectColor }} />
          <span className="text-[10px] text-muted-foreground truncate">{task.projectName}</span>
          {showDate && task.dueDate && (
            <span className="text-[10px] text-muted-foreground">· {formatDate(task.dueDate)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, count, className }: { icon: typeof AlertTriangle; label: string; count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <div className={cn("flex items-center gap-1.5 px-2 pt-2 pb-0.5", className)}>
      <Icon className="h-3 w-3" />
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label} ({count})</span>
    </div>
  );
}

export function TodayWidget() {
  const [data, setData] = useState<WidgetData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [tab, setTab] = useState<Tab>("today");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/today-tasks");
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
  }

  const { execute: toggle } = useServerAction(
    async (input: { id: string; status: string }) => updateTask(input),
    { onSuccess: () => fetchData() }
  );

  function handleToggle(id: string, status: string) {
    toggle({ id, status });
  }

  if (!data) return null;

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="fixed bottom-4 right-4 z-50 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        title="오늘 업무 열기"
      >
        <CalendarDays className="h-4 w-4" />
        {data.overdue.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
            {data.overdue.length}
          </span>
        )}
      </button>
    );
  }

  const todayTotal = data.dueToday.length + data.inProgress.length;
  const todayDone = data.doneToday.length;
  const reminderTotal = data.overdue.length + data.upcoming.length;
  const allActive = data.overdue.length + data.dueToday.length + data.upcoming.length + data.inProgress.length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl rounded-xl border bg-background/95 backdrop-blur-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent/30 rounded-t-xl"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">오늘 업무</span>
          {data.overdue.length > 0 && (
            <span className="h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {data.overdue.length}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {todayDone}/{allActive + todayDone}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); setDismissed(true); }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className={cn("h-full transition-all duration-500", data.overdue.length > 0 ? "bg-red-500" : "bg-green-500")}
          style={{ width: `${allActive + todayDone > 0 ? (todayDone / (allActive + todayDone)) * 100 : 0}%` }}
        />
      </div>

      {/* Expanded content */}
      {expanded && (
        <>
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setTab("today")}
              className={cn("flex-1 py-1.5 text-xs font-medium transition-colors", tab === "today" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              오늘 ({todayTotal})
            </button>
            <button
              onClick={() => setTab("reminders")}
              className={cn("flex-1 py-1.5 text-xs font-medium transition-colors relative", tab === "reminders" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              마감 알림 ({reminderTotal})
              {data.overdue.length > 0 && (
                <span className="absolute top-1 ml-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
              )}
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {tab === "today" ? (
              /* TODAY TAB */
              data.dueToday.length === 0 && data.inProgress.length === 0 && data.doneToday.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">오늘 예정된 업무가 없습니다</div>
              ) : (
                <div className="py-1">
                  <SectionHeader icon={Clock} label="오늘 마감" count={data.dueToday.length} />
                  {data.dueToday.map((t) => <TaskRow key={t.id} task={t} onToggle={handleToggle} />)}

                  <SectionHeader icon={Zap} label="진행 중" count={data.inProgress.length} />
                  {data.inProgress.map((t) => <TaskRow key={t.id} task={t} onToggle={handleToggle} />)}

                  {data.doneToday.length > 0 && (
                    <>
                      <SectionHeader icon={CheckCircle2} label="완료" count={data.doneToday.length} className="text-green-600" />
                      {data.doneToday.map((t) => <TaskRow key={t.id} task={t} onToggle={handleToggle} />)}
                    </>
                  )}
                </div>
              )
            ) : (
              /* REMINDERS TAB */
              data.overdue.length === 0 && data.upcoming.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">지연되거나 임박한 업무가 없습니다</div>
              ) : (
                <div className="py-1">
                  <SectionHeader icon={AlertTriangle} label="지연됨" count={data.overdue.length} className="text-red-600" />
                  {data.overdue.map((t) => <TaskRow key={t.id} task={t} onToggle={handleToggle} showDate />)}

                  <SectionHeader icon={Clock} label="3일 내 마감" count={data.upcoming.length} className="text-yellow-600" />
                  {data.upcoming.map((t) => <TaskRow key={t.id} task={t} onToggle={handleToggle} showDate />)}
                </div>
              )
            )}
          </div>

          <div className="px-3 py-2 border-t flex justify-between">
            <Link href="/today" className="text-xs text-primary hover:underline">오늘 업무 전체 보기</Link>
            <Link href="/reminders" className="text-xs text-primary hover:underline">마감 알림 전체 보기</Link>
          </div>
        </>
      )}
    </div>
  );
}
