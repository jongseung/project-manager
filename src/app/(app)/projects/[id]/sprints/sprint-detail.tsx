"use client";

import { useState } from "react";
import { Plus, X, Check, Circle, Calendar, Target, BookOpen, Flame, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SprintTaskPicker } from "@/components/sprint/sprint-task-picker";
import { BurndownChart } from "@/components/sprint/burndown-chart";
import { PriorityBadge } from "@/components/task/priority-badge";
import { useServerAction } from "@/hooks/use-server-action";
import { removeTaskFromSprint, updateSprint } from "@/actions/sprint";
import { updateTask } from "@/actions/task";
import { formatDate, cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInDays, parseISO, isAfter } from "date-fns";

interface SprintTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  storyId: string | null;
}

interface SprintDetailProps {
  sprint: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    goalDescription: string | null;
    tasks: { task: SprintTask }[];
  };
  allTasks: { id: string; title: string; status: string; priority: string }[];
  stories?: { id: string; title: string }[];
}

const STATUS_CONFIG: Record<string, { badge: string; label: string; guide: string }> = {
  planning: {
    badge: "bg-gray-100 text-gray-700",
    label: "계획 중",
    guide: "[계획 단계] 백로그에서 이번 스프린트에 수행할 태스크를 선택하세요. 스프린트 목표를 기준으로 우선순위가 높은 항목부터 추가합니다.",
  },
  active: {
    badge: "bg-green-100 text-green-700",
    label: "진행 중",
    guide: "[진행 단계] 칸반보드에서 태스크를 실행하세요. 매일 진행률을 확인하며, 태스크 완료율이 경과 시간보다 앞서야 정상 페이스입니다.",
  },
  completed: {
    badge: "bg-blue-100 text-blue-700",
    label: "완료",
    guide: "[완료] 스프린트 목표 달성 여부를 확인하고, 아래 회고를 작성해주세요. 미완료 태스크는 다음 스프린트로 이월합니다.",
  },
};

export function SprintDetail({ sprint, allTasks, stories = [] }: SprintDetailProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expanded, setExpanded] = useState(sprint.status === "active");
  const [retroText, setRetroText] = useState("");
  const [retroSaved, setRetroSaved] = useState(false);

  const assignedTaskIds = sprint.tasks.map((t) => t.task.id);
  const total = sprint.tasks.length;
  const completed = sprint.tasks.filter((t) => t.task.status === "done").length;
  const inProgress = sprint.tasks.filter((t) => t.task.status === "in_progress" || t.task.status === "in_review").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const endDate = parseISO(sprint.endDate);
  const startDate = parseISO(sprint.startDate);
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const daysLeft = Math.max(0, differenceInDays(endDate, new Date()) + 1);
  const isOverdue = isAfter(new Date(), endDate) && sprint.status === "active";
  const daysPct = totalDays > 0 ? Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)) : 100;

  // Group tasks by story
  const storyMap = new Map(stories.map((s) => [s.id, s.title]));
  const grouped = new Map<string, SprintTask[]>();
  sprint.tasks.forEach(({ task }) => {
    const key = task.storyId ?? "__none";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(task);
  });

  const config = STATUS_CONFIG[sprint.status] ?? STATUS_CONFIG.planning;

  const { execute: remove } = useServerAction(async (taskId: string) => removeTaskFromSprint(sprint.id, taskId), { successMessage: "태스크가 제거되었습니다" });
  const { execute: changeStatus } = useServerAction(async (status: string) => updateSprint(sprint.id, { status }), { successMessage: "스프린트가 수정되었습니다" });
  const { execute: toggleTask } = useServerAction(async (input: { id: string; status: string }) => updateTask(input));

  return (
    <Card className={cn(isOverdue && "border-red-300 dark:border-red-800", sprint.status === "active" && "ring-1 ring-primary/20")}>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <CardTitle className="text-base">{sprint.name}</CardTitle>
            <Badge className={config.badge} variant="secondary">{sprint.status}</Badge>
            {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Select value={sprint.status} onValueChange={changeStatus}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">계획 중</SelectItem>
                <SelectItem value="active">진행 중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
            </Button>
          </div>
        </div>

        {/* Sprint Goal */}
        {sprint.goalDescription && (
          <div className="flex items-start gap-2 mt-2 bg-primary/5 rounded-md px-3 py-2">
            <Target className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-medium text-primary">Sprint Goal</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sprint.goalDescription}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
          </span>
          <span className={cn("font-medium", isOverdue ? "text-red-500" : daysLeft <= 3 && sprint.status === "active" ? "text-yellow-600" : "")}>
            {sprint.status === "completed" ? "Completed" : isOverdue ? "Overdue" : `${daysLeft}d left`}
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3" />
            {completed}/{total} done · {inProgress} active
          </span>
        </div>

        {/* Dual progress bars */}
        <div className="space-y-1.5 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-10 text-muted-foreground">Tasks</span>
            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] w-8 text-right font-medium">{progress}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-10 text-muted-foreground">Time</span>
            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", daysPct > progress + 20 ? "bg-red-400" : "bg-blue-400")} style={{ width: `${daysPct}%` }} />
            </div>
            <span className="text-[10px] w-8 text-right font-medium">{daysPct}%</span>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Status-specific guide */}
          <div className="bg-muted/50 rounded-md px-3 py-2 text-xs text-muted-foreground">
            {config.guide}
          </div>

          {/* Tasks grouped by story */}
          {sprint.tasks.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-muted-foreground">아직 태스크가 없습니다.</p>
              <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> 백로그에서 태스크 추가
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(grouped.entries()).map(([key, tasks]) => {
                const groupDone = tasks.filter((t) => t.status === "done").length;
                return (
                  <div key={key}>
                    {key !== "__none" && (
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <BookOpen className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium">{storyMap.get(key) ?? "Story"}</span>
                        <span className="text-[10px] text-muted-foreground">({groupDone}/{tasks.length} done)</span>
                      </div>
                    )}
                    {key === "__none" && grouped.size > 1 && (
                      <div className="text-xs font-medium text-muted-foreground mb-1 px-1">Other Tasks</div>
                    )}
                    <div className="space-y-0.5">
                      {tasks.map((task) => (
                        <div key={task.id} className="group flex items-center gap-3 rounded-md px-3 py-1.5 hover:bg-accent/50">
                          <button onClick={() => toggleTask({ id: task.id, status: task.status === "done" ? "todo" : "done" })} className="shrink-0">
                            {task.status === "done" ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/40 hover:text-primary transition-colors" />
                            )}
                          </button>
                          <span className={cn("text-sm flex-1 truncate", task.status === "done" && "line-through text-muted-foreground")}>
                            {task.title}
                          </span>
                          <PriorityBadge priority={task.priority} />
                          <Badge variant="outline" className="text-[10px] capitalize">{task.status.replace("_", " ")}</Badge>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => remove(task.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sprint Retrospective (when completed) */}
          {sprint.status === "completed" && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Sprint 회고</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium">잘한 점 / 개선할 점 / 다음 스프린트 액션</p>
                  <Textarea
                    value={retroText}
                    onChange={(e) => setRetroText(e.target.value)}
                    placeholder={"잘한 점:\n- \n\n개선할 점:\n- \n\n다음 스프린트 액션:\n- "}
                    rows={6}
                    className="text-xs"
                  />
                </div>
                {retroSaved ? (
                  <p className="text-xs text-green-600">회고가 저장되었습니다</p>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setRetroSaved(true)} disabled={!retroText.trim()}>
                    회고 저장
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 번다운 차트 */}
          {sprint.status !== "planning" && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium mb-2">번다운 차트</p>
              <BurndownChart
                startDate={sprint.startDate}
                endDate={sprint.endDate}
                totalTasks={total}
                completedByDay={[]}
              />
            </div>
          )}

          {/* Sprint Health Indicator */}
          {sprint.status === "active" && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium mb-2">스프린트 건강 상태</p>
              <div className="flex gap-3">
                {progress >= daysPct ? (
                  <Badge variant="outline" className="text-green-600 border-green-300">정상 진행 - 태스크 완료율이 일정 경과율보다 앞서고 있습니다</Badge>
                ) : daysPct - progress <= 20 ? (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">주의 필요 - 일정 대비 진행이 약간 느립니다. 병목 확인이 필요합니다</Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-300">지연 - 일정 대비 진행이 뒤처져 있습니다. 스코프 조정을 검토하세요</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}

      <SprintTaskPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        sprintId={sprint.id}
        availableTasks={allTasks}
        assignedTaskIds={assignedTaskIds}
      />
    </Card>
  );
}
