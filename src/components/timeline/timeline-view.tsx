"use client";

import { useMemo, useState } from "react";
import { differenceInDays, parseISO, min, max, subDays, addDays, format } from "date-fns";
import { TimelineHeader } from "./timeline-header";
import { TimelineBar } from "./timeline-bar";
import { MilestoneMarker } from "./milestone-marker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarPlus, ChevronDown, ChevronRight } from "lucide-react";
import { useServerAction } from "@/hooks/use-server-action";
import { updateTask } from "@/actions/task";
import { PriorityBadge } from "@/components/task/priority-badge";
import { cn } from "@/lib/utils";
import type { Task, Milestone } from "@prisma/client";

type TaskWithHierarchy = Task & {
  epic?: { id: string; name: string } | null;
  story?: { id: string; title: string; epicId: string | null } | null;
};

interface TimelineViewProps {
  tasks: TaskWithHierarchy[];
  milestones: Milestone[];
  epics?: { id: string; name: string }[];
  stories?: { id: string; title: string; epicId: string | null }[];
  dependencies?: { predecessorTaskId: string; successorTaskId: string }[];
}

const DAY_WIDTH = 32;

interface RowItem {
  type: "epic" | "story" | "task" | "milestone";
  id: string;
  label: string;
  depth: number;
  task?: TaskWithHierarchy;
  milestone?: Milestone;
  epicId?: string;
}

function UnscheduledRow({ task }: { task: TaskWithHierarchy }) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));
  const { execute: save, isPending } = useServerAction(
    async (input: Parameters<typeof updateTask>[0]) => updateTask(input),
    { successMessage: "일정이 등록되었습니다", onSuccess: () => setOpen(false) }
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-accent/50 transition-colors w-full text-left group">
          <CalendarPlus className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary shrink-0" />
          <span className="truncate flex-1">{task.title}</span>
          {task.epic && <span className="text-[10px] text-muted-foreground">{task.epic.name}</span>}
          <PriorityBadge priority={task.priority} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium truncate">{task.title}</p>
          <div className="space-y-2"><Label className="text-xs">시작일</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs" /></div>
          <div className="space-y-2"><Label className="text-xs">마감일</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-8 text-xs" /></div>
          <Button size="sm" className="w-full h-7 text-xs" onClick={() => save({ id: task.id, startDate, dueDate })} disabled={isPending}>일정 등록</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TimelineView({ tasks, milestones, epics = [], stories = [], dependencies = [] }: TimelineViewProps) {
  const datedTasks = tasks.filter((t) => t.startDate || t.dueDate);
  const undatedTasks = tasks.filter((t) => !t.startDate && !t.dueDate);

  const [collapsedEpics, setCollapsedEpics] = useState<Set<string>>(new Set());
  const [collapsedStories, setCollapsedStories] = useState<Set<string>>(new Set());

  function toggleEpic(id: string) {
    setCollapsedEpics((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleStory(id: string) {
    setCollapsedStories((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // Build hierarchical row list: Epic > Story > Task
  const rows = useMemo(() => {
    const result: RowItem[] = [];
    const epicMap = new Map(epics.map((e) => [e.id, e]));
    const storyMap = new Map(stories.map((s) => [s.id, s]));
    const usedEpics = new Set<string>();
    const usedStories = new Set<string>();

    // Group dated tasks by epic > story
    const tasksByEpic = new Map<string, Map<string, TaskWithHierarchy[]>>();
    const noEpicTasks: TaskWithHierarchy[] = [];

    datedTasks.forEach((t) => {
      const eid = t.epicId ?? t.story?.epicId ?? null;
      const sid = t.storyId ?? null;

      if (eid) {
        if (!tasksByEpic.has(eid)) tasksByEpic.set(eid, new Map());
        const storyGroup = tasksByEpic.get(eid)!;
        const key = sid ?? "__direct";
        if (!storyGroup.has(key)) storyGroup.set(key, []);
        storyGroup.get(key)!.push(t);
      } else if (sid) {
        // Story without epic
        if (!tasksByEpic.has("__no_epic")) tasksByEpic.set("__no_epic", new Map());
        const storyGroup = tasksByEpic.get("__no_epic")!;
        if (!storyGroup.has(sid)) storyGroup.set(sid, []);
        storyGroup.get(sid)!.push(t);
      } else {
        noEpicTasks.push(t);
      }
    });

    // Render epics in order
    epics.forEach((epic) => {
      const storyGroup = tasksByEpic.get(epic.id);
      if (!storyGroup) return;
      usedEpics.add(epic.id);

      result.push({ type: "epic", id: epic.id, label: epic.name, depth: 0 });

      if (collapsedEpics.has(epic.id)) return;

      // Stories under this epic
      const epicStories = stories.filter((s) => s.epicId === epic.id);
      epicStories.forEach((story) => {
        const storyTasks = storyGroup.get(story.id);
        if (!storyTasks) return;
        usedStories.add(story.id);

        result.push({ type: "story", id: story.id, label: story.title, depth: 1, epicId: epic.id });

        if (!collapsedStories.has(story.id)) {
          storyTasks.forEach((t) => result.push({ type: "task", id: t.id, label: t.title, depth: 2, task: t }));
        }
      });

      // Direct tasks under epic (no story)
      const directTasks = storyGroup.get("__direct");
      if (directTasks) {
        directTasks.forEach((t) => result.push({ type: "task", id: t.id, label: t.title, depth: 1, task: t }));
      }
    });

    // Stories without epic
    const noEpicStories = tasksByEpic.get("__no_epic");
    if (noEpicStories) {
      noEpicStories.forEach((storyTasks, sid) => {
        const story = storyMap.get(sid);
        if (!story || usedStories.has(sid)) return;
        result.push({ type: "story", id: sid, label: story.title, depth: 0 });
        if (!collapsedStories.has(sid)) {
          storyTasks.forEach((t) => result.push({ type: "task", id: t.id, label: t.title, depth: 1, task: t }));
        }
      });
    }

    // Tasks with no epic or story
    if (noEpicTasks.length > 0) {
      noEpicTasks.forEach((t) => result.push({ type: "task", id: t.id, label: t.title, depth: 0, task: t }));
    }

    // Milestones at the end
    milestones.forEach((m) => result.push({ type: "milestone", id: m.id, label: m.name, depth: 0, milestone: m }));

    return result;
  }, [datedTasks, milestones, epics, stories, collapsedEpics, collapsedStories]);

  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    const dates: Date[] = [];
    datedTasks.forEach((t) => {
      if (t.startDate) dates.push(parseISO(t.startDate));
      if (t.dueDate) dates.push(parseISO(t.dueDate));
    });
    milestones.forEach((m) => dates.push(parseISO(m.targetDate)));
    if (dates.length === 0) {
      const now = new Date();
      const s = subDays(now, 7), e = addDays(now, 30);
      return { timelineStart: s, timelineEnd: e, totalDays: differenceInDays(e, s) + 1 };
    }
    const s = subDays(min(dates), 7), e = addDays(max(dates), 14);
    return { timelineStart: s, timelineEnd: e, totalDays: differenceInDays(e, s) + 1 };
  }, [datedTasks, milestones]);

  const todayOffset = differenceInDays(new Date(), timelineStart);
  const showTodayLine = todayOffset >= 0 && todayOffset <= totalDays;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 shrink-0 border-r bg-muted/30">
          <div className="h-[44px] border-b flex items-end px-3 pb-1">
            <span className="text-xs font-medium text-muted-foreground">업무 구조</span>
          </div>
          {rows.map((row) => {
            const today = new Date().toISOString().split("T")[0];
            const isEpic = row.type === "epic";
            const isStory = row.type === "story";
            const isTask = row.type === "task";
            const isMilestone = row.type === "milestone";
            const overdue = isTask && row.task?.dueDate && row.task.status !== "done" && row.task.status !== "cancelled" && row.task.dueDate < today;

            return (
              <div
                key={`${row.type}-${row.id}`}
                className={cn(
                  "h-9 flex items-center gap-1 border-b",
                  isEpic && "bg-muted/50 font-medium",
                  isStory && "bg-muted/20",
                )}
                style={{ paddingLeft: 12 + row.depth * 16 }}
              >
                {isEpic && (
                  <button onClick={() => toggleEpic(row.id)} className="shrink-0">
                    {collapsedEpics.has(row.id) ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
                {isStory && (
                  <button onClick={() => toggleStory(row.id)} className="shrink-0">
                    {collapsedStories.has(row.id) ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
                {isTask && (
                  <div className={cn("h-1.5 w-1.5 rounded-full shrink-0",
                    overdue ? "bg-red-500" : row.task?.status === "done" ? "bg-green-500" : row.task?.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"
                  )} />
                )}
                <span className={cn(
                  "text-xs truncate",
                  isEpic && "text-xs font-semibold",
                  isStory && "text-xs font-medium text-muted-foreground",
                  isMilestone && "text-xs font-medium",
                  overdue && "text-red-600",
                )} title={row.label}>
                  {isMilestone ? "[M] " : ""}{row.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timeline area */}
        <div className="flex-1 overflow-x-auto relative">
          <div className="relative" style={{ width: totalDays * DAY_WIDTH }}>
            <TimelineHeader startDate={timelineStart} endDate={timelineEnd} dayWidth={DAY_WIDTH} offsetDays={0} />

            {showTodayLine && (
              <div className="absolute top-0 bottom-0 w-px bg-red-400 z-20 pointer-events-none" style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}>
                <div className="absolute -top-0 -left-2.5 bg-red-400 text-white text-[9px] px-1 rounded-b font-medium">오늘</div>
              </div>
            )}

            {rows.map((row) => {
              if (row.type === "epic") {
                return <div key={`e-${row.id}`} className="h-9 border-b bg-muted/30" />;
              }
              if (row.type === "story") {
                return <div key={`s-${row.id}`} className="h-9 border-b bg-muted/10" />;
              }
              if (row.type === "milestone" && row.milestone) {
                const offset = Math.max(0, differenceInDays(parseISO(row.milestone.targetDate), timelineStart));
                return (
                  <div key={`m-${row.id}`} className="border-b">
                    <MilestoneMarker name={row.milestone.name} status={row.milestone.status} offsetDays={offset} dayWidth={DAY_WIDTH} />
                  </div>
                );
              }
              if (row.type === "task" && row.task) {
                const t = row.task;
                const start = t.startDate ? parseISO(t.startDate) : t.dueDate ? parseISO(t.dueDate) : timelineStart;
                const end = t.dueDate ? parseISO(t.dueDate) : t.startDate ? addDays(parseISO(t.startDate), 1) : timelineStart;
                const offset = Math.max(0, differenceInDays(start, timelineStart));
                const duration = Math.max(1, differenceInDays(end, start) + 1);
                return (
                  <div key={`t-${row.id}`} className="border-b">
                    <TimelineBar taskId={t.id} title={t.title} status={t.status} startDate={t.startDate} dueDate={t.dueDate} startOffset={offset} duration={duration} dayWidth={DAY_WIDTH} totalDays={totalDays} />
                  </div>
                );
              }
              return null;
            })}

            {/* Dependency arrows SVG overlay */}
            {dependencies.length > 0 && (
              <svg
                className="absolute top-[44px] left-0 pointer-events-none"
                style={{ width: totalDays * DAY_WIDTH, height: rows.length * 36 }}
              >
                <defs>
                  <marker id="dep-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="var(--color-chart-1)" opacity="0.6" />
                  </marker>
                </defs>
                {dependencies.map((dep, i) => {
                  const srcRow = rows.find((r) => r.type === "task" && r.id === dep.predecessorTaskId);
                  const tgtRow = rows.find((r) => r.type === "task" && r.id === dep.successorTaskId);
                  if (!srcRow?.task || !tgtRow?.task) return null;

                  const srcStart = srcRow.task.startDate ? parseISO(srcRow.task.startDate) : timelineStart;
                  const srcEnd = srcRow.task.dueDate ? parseISO(srcRow.task.dueDate) : srcStart;
                  const tgtStart = tgtRow.task.startDate ? parseISO(tgtRow.task.startDate) : timelineStart;

                  const srcX = (differenceInDays(srcEnd, timelineStart) + 1) * DAY_WIDTH;
                  const tgtX = differenceInDays(tgtStart, timelineStart) * DAY_WIDTH;
                  const srcRowIndex = rows.indexOf(srcRow);
                  const tgtRowIndex = rows.indexOf(tgtRow);
                  const srcY = srcRowIndex * 36 + 18;
                  const tgtY = tgtRowIndex * 36 + 18;

                  return (
                    <path
                      key={i}
                      d={`M ${srcX} ${srcY} C ${srcX + 20} ${srcY}, ${tgtX - 20} ${tgtY}, ${tgtX} ${tgtY}`}
                      stroke="var(--color-chart-1)"
                      strokeWidth={1.5}
                      fill="none"
                      markerEnd="url(#dep-arrow)"
                      opacity={0.6}
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      </div>

      {undatedTasks.length > 0 && (
        <div className="border-t p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">일정 미등록 ({undatedTasks.length}) - 클릭하여 일정을 지정하세요</p>
          <div className="grid gap-0.5 grid-cols-1 sm:grid-cols-2">
            {undatedTasks.map((t) => <UnscheduledRow key={t.id} task={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}
