import { CalendarDays, AlertTriangle, Clock, Repeat, CheckCircle2, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { Header } from "@/components/layout/header";
import { QuickAdd } from "@/components/today/quick-add";
import { TodayTaskList } from "@/components/today/today-task-list";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/session";

function Section({
  icon: Icon, dot, title, count, accent, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  dot: string;
  title: string;
  count: number;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(
      "overflow-hidden rounded-xl border bg-card",
      accent ? "border-red-500/25" : "border-border"
    )}>
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        <span className="rounded-full bg-muted px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">{count}</span>
      </div>
      <div className="px-2 pb-2">{children}</div>
    </section>
  );
}

export default async function TodayPage() {
  const ctx = await requireOrganization();
  const today = format(new Date(), "yyyy-MM-dd");
  void ctx;

  const [overdue, dueToday, inProgress, recurringToday, recentDone, projects] = await Promise.all([
    db.task.findMany({
      where: { dueDate: { lt: today }, status: { notIn: ["done", "cancelled"] }, archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } }, member: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),
    db.task.findMany({
      where: { dueDate: today, status: { notIn: ["done", "cancelled"] }, archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } }, member: { select: { name: true } }, subtasks: { select: { id: true, status: true } } },
      orderBy: [{ priority: "asc" }, { sortOrder: "asc" }],
    }),
    db.task.findMany({
      where: { status: "in_progress", archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } }, member: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.task.findMany({
      where: { recurringTemplateId: { not: null }, createdAt: { gte: new Date(today + "T00:00:00") }, archivedAt: null, parentTaskId: null },
      include: { project: { select: { name: true, color: true } }, subtasks: { select: { id: true, status: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.task.findMany({
      where: { status: "done", completedAt: { gte: new Date(today + "T00:00:00") }, parentTaskId: null },
      include: { project: { select: { name: true } } },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
    db.project.findMany({
      where: { status: "active", archivedAt: null },
      include: { workspace: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // Deduplicate: remove dueToday items that are also in recurringToday / in-progress overlaps
  const recurringIds = new Set(recurringToday.map((t) => t.id));
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

      <div className="mx-auto max-w-3xl space-y-5 p-6">
        <QuickAdd projects={projectOptions} defaultProjectId={projectOptions[0]?.id} />

        {/* Summary strip */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums">{totalTodo}</span>
            <span className="text-sm text-muted-foreground">건의 할 일</span>
          </div>
          {overdue.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
              <AlertTriangle className="h-3 w-3" />지연 {overdue.length}
            </span>
          )}
          {recentDone.length > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" />오늘 {recentDone.length}건 완료
            </span>
          )}
        </div>

        {totalTodo === 0 && recentDone.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-12 w-12" />}
            title="오늘 할 일이 없습니다"
            description="오늘 마감인 태스크가 없습니다. 위에서 빠르게 추가하거나 프로젝트 보드를 확인하세요."
          />
        ) : (
          <div className="space-y-4">
            {overdue.length > 0 && (
              <Section icon={AlertTriangle} dot="bg-red-500" title="지연" count={overdue.length} accent>
                <TodayTaskList tasks={overdue} showDueDate />
              </Section>
            )}
            {recurringToday.length > 0 && (
              <Section icon={Repeat} dot="bg-sky-400" title="루틴" count={recurringToday.length}>
                <TodayTaskList tasks={recurringToday} showSubtasks />
              </Section>
            )}
            {filteredDueToday.length > 0 && (
              <Section icon={Clock} dot="bg-amber-400" title="오늘 마감" count={filteredDueToday.length}>
                <TodayTaskList tasks={filteredDueToday} showSubtasks />
              </Section>
            )}
            {filteredInProgress.length > 0 && (
              <Section icon={Loader2} dot="bg-violet-400" title="진행 중" count={filteredInProgress.length}>
                <TodayTaskList tasks={filteredInProgress} />
              </Section>
            )}
            {recentDone.length > 0 && (
              <Section icon={CheckCircle2} dot="bg-emerald-500" title="오늘 완료" count={recentDone.length}>
                <div className="space-y-0.5 px-2 py-1">
                  {recentDone.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 py-1 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="flex-1 truncate text-muted-foreground line-through">{t.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground/70">{t.project.name}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
