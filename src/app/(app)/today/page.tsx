import { CalendarDays, AlertTriangle, Clock, Repeat, CheckCircle2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuickAdd } from "@/components/today/quick-add";
import { TodayTaskList } from "@/components/today/today-task-list";
import { EmptyState } from "@/components/shared/empty-state";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/session";

export default async function TodayPage() {
  const ctx = await requireOrganization();
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const [overdue, dueToday, inProgress, recurringToday, recentDone, projects] = await Promise.all([
    // Overdue tasks
    db.task.findMany({
      where: { dueDate: { lt: today }, status: { notIn: ["done", "cancelled"] }, archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } }, member: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),
    // Due today
    db.task.findMany({
      where: { dueDate: today, status: { notIn: ["done", "cancelled"] }, archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } }, member: { select: { name: true } }, subtasks: { select: { id: true, status: true } } },
      orderBy: [{ priority: "asc" }, { sortOrder: "asc" }],
    }),
    // In progress (no due date but actively being worked on)
    db.task.findMany({
      where: { status: "in_progress", archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } }, member: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    // Recurring tasks created today
    db.task.findMany({
      where: { recurringTemplateId: { not: null }, createdAt: { gte: new Date(today + "T00:00:00") }, archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } }, subtasks: { select: { id: true, status: true } } },
      orderBy: { createdAt: "desc" },
    }),
    // Completed today
    db.task.findMany({
      where: { status: "done", completedAt: { gte: new Date(today + "T00:00:00") }, parentTaskId: null },
      include: { project: { select: { name: true } } },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
    // Projects for quick add (active, not archived)
    db.project.findMany({
      where: { status: "active", archivedAt: null },
      include: { workspace: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // Deduplicate: remove dueToday items that are also in recurringToday
  const recurringIds = new Set(recurringToday.map((t) => t.id));
  const inProgressIds = new Set(inProgress.map((t) => t.id));
  const filteredDueToday = dueToday.filter((t) => !recurringIds.has(t.id));
  const filteredInProgress = inProgress.filter((t) => !recurringIds.has(t.id) && t.dueDate !== today);

  const totalTodo = overdue.length + filteredDueToday.length + recurringToday.length + filteredInProgress.length;
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, workspaceName: p.workspace.name }));

  return (
    <div>
      <Header title="오늘 할 일">
        <span className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </span>
      </Header>

      <div className="p-6 max-w-full space-y-6">
        <QuickAdd projects={projectOptions} defaultProjectId={projectOptions[0]?.id} />

        {/* Summary bar */}
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">{totalTodo}건의 업무</span>
          {recentDone.length > 0 && (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {recentDone.length} 오늘 완료
            </span>
          )}
        </div>

        {totalTodo === 0 && recentDone.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-12 w-12" />}
            title="오늘 할 일이 없습니다"
            description="오늘 마감인 태스크가 없습니다. 태스크를 추가하거나 프로젝트 보드를 확인하세요."
          />
        ) : (
          <>
            {/* Overdue */}
            {overdue.length > 0 && (
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    지연 ({overdue.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TodayTaskList tasks={overdue} showDueDate />
                </CardContent>
              </Card>
            )}

            {/* Recurring tasks */}
            {recurringToday.length > 0 && (
              <Card className="border-blue-200 dark:border-blue-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                    <Repeat className="h-4 w-4" />
                    루틴 ({recurringToday.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TodayTaskList tasks={recurringToday} showSubtasks />
                </CardContent>
              </Card>
            )}

            {/* Due today */}
            {filteredDueToday.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    오늘 마감 ({filteredDueToday.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TodayTaskList tasks={filteredDueToday} showSubtasks />
                </CardContent>
              </Card>
            )}

            {/* In Progress */}
            {filteredInProgress.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    진행 중 ({filteredInProgress.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TodayTaskList tasks={filteredInProgress} />
                </CardContent>
              </Card>
            )}

            {/* Completed today */}
            {recentDone.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    오늘 완료 ({recentDone.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {recentDone.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span className="flex-1 line-through text-muted-foreground truncate">{t.title}</span>
                        <span className="text-xs text-muted-foreground">{t.project.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
