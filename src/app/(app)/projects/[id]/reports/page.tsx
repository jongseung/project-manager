import { notFound } from "next/navigation";
import { getProject } from "@/actions/project";
import { ProjectHeader } from "@/components/project/project-header";
import { BurndownChart } from "@/components/reports/burndown-chart";
import { VelocityChart } from "@/components/reports/velocity-chart";
import { StatusDistribution } from "@/components/reports/status-distribution";
import { PriorityDistribution } from "@/components/reports/priority-distribution";
import { MemberWorkload } from "@/components/reports/member-workload";
import { WeeklyTrend } from "@/components/reports/weekly-trend";
import { ProjectSummary } from "@/components/reports/project-summary";
import { db } from "@/lib/db";
import { computeHealth, computeCycleTime } from "@/lib/metrics";
import { format, eachDayOfInterval, parseISO, subWeeks, startOfWeek, endOfWeek } from "date-fns";

export default async function ReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // All tasks
  const allTasks = await db.task.findMany({
    where: { projectId: id, parentTaskId: null, archivedAt: null },
    select: { id: true, status: true, priority: true, dueDate: true, completedAt: true, memberId: true, createdAt: true },
  });

  // Cycle time — over all completed tasks in project.
  const cycle = computeCycleTime(allTasks);

  // Health — quick aggregate. WIP limit heuristic: 1.5x active members count if present.
  const activeMemberCount = new Set(allTasks.map((t) => t.memberId).filter(Boolean)).size;
  const health = computeHealth({
    total: allTasks.length,
    overdue: allTasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== "done" && t.status !== "cancelled").length,
    inProgress: allTasks.filter((t) => t.status === "in_progress").length,
    wipLimit: activeMemberCount > 0 ? Math.max(3, activeMemberCount * 2) : undefined,
    blockedCount: 0, // future: query Dependency table
  });

  // Members
  const members = await db.member.findMany({
    where: { isActive: true },
    select: { id: true, name: true, color: true },
  });

  // Summary stats
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = allTasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== "done" && t.status !== "cancelled").length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Status distribution
  const statusCounts: Record<string, number> = {};
  for (const t of allTasks) {
    statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
  }

  // Priority distribution
  const priorityCounts: Record<string, number> = {};
  for (const t of allTasks) {
    priorityCounts[t.priority] = (priorityCounts[t.priority] ?? 0) + 1;
  }

  // Member workload
  const memberWorkload = members.map((m) => {
    const tasks = allTasks.filter((t) => t.memberId === m.id);
    const done = tasks.filter((t) => t.status === "done").length;
    const active = tasks.filter((t) => t.status === "in_progress" || t.status === "in_review").length;
    const todo = tasks.filter((t) => t.status === "todo" || t.status === "backlog").length;
    return { name: m.name, color: m.color, done, active, todo, total: tasks.length };
  }).filter((m) => m.total > 0);

  // Unassigned
  const unassigned = allTasks.filter((t) => !t.memberId).length;

  // Weekly trend (last 8 weeks)
  const weeklyData: { week: string; created: number; completed: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const weekLabel = format(weekStart, "MM/dd");
    const created = allTasks.filter((t) => {
      const d = new Date(t.createdAt);
      return d >= weekStart && d <= weekEnd;
    }).length;
    const completed = allTasks.filter((t) => {
      if (!t.completedAt) return false;
      const d = new Date(t.completedAt);
      return d >= weekStart && d <= weekEnd;
    }).length;
    weeklyData.push({ week: weekLabel, created, completed });
  }

  // Active sprint burndown
  const activeSprint = await db.sprint.findFirst({
    where: { projectId: id, status: "active" },
    include: { tasks: { include: { task: { select: { status: true, completedAt: true } } } } },
  });

  let burndownData: { date: string; remaining: number; ideal: number }[] = [];
  if (activeSprint) {
    const sprintDays = eachDayOfInterval({ start: parseISO(activeSprint.startDate), end: parseISO(activeSprint.endDate) });
    const total = activeSprint.tasks.length;
    burndownData = sprintDays.map((day, i) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const completedByDay = activeSprint.tasks.filter((t) => t.task.completedAt && format(t.task.completedAt, "yyyy-MM-dd") <= dayStr).length;
      return {
        date: format(day, "MM/dd"),
        remaining: total - completedByDay,
        ideal: Math.round(total - (total * (i / (sprintDays.length - 1 || 1)))),
      };
    });
  }

  // Velocity per sprint
  const sprints = await db.sprint.findMany({
    where: { projectId: id, status: "completed" },
    include: { tasks: { include: { task: { select: { status: true } } } } },
    orderBy: { startDate: "asc" },
  });
  const velocityData = sprints.map((s) => ({
    sprint: s.name,
    completed: s.tasks.filter((t) => t.task.status === "done").length,
  }));

  return (
    <div>
      <ProjectHeader projectId={project.id} projectName={project.name} workspaceName={project.workspace.name} projectColor={project.color} />
      <div className="p-6 space-y-6 max-w-full">
        {/* Health + Cycle Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">프로젝트 헬스</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-3xl font-bold ${
                    health.level === "green" ? "text-emerald-600 dark:text-emerald-400" :
                    health.level === "yellow" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                  }`}>
                    {health.score}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                health.level === "green" ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400" :
                health.level === "yellow" ? "bg-amber-500/12 text-amber-700 dark:text-amber-400" :
                "bg-red-500/12 text-red-700 dark:text-red-400"
              }`}>
                {health.level === "green" ? "양호" : health.level === "yellow" ? "주의" : "위험"}
              </span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {health.reasons.map((r, i) => <li key={i}>· {r}</li>)}
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">사이클 타임</h3>
            {cycle.count === 0 ? (
              <p className="text-sm text-muted-foreground">완료된 태스크가 아직 없습니다.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[10px] text-muted-foreground">평균</div>
                  <div className="text-xl font-semibold tabular-nums">{cycle.avg}<span className="text-xs text-muted-foreground ml-1">일</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">중간값</div>
                  <div className="text-xl font-semibold tabular-nums">{cycle.median}<span className="text-xs text-muted-foreground ml-1">일</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">P90</div>
                  <div className="text-xl font-semibold tabular-nums">{cycle.p90}<span className="text-xs text-muted-foreground ml-1">일</span></div>
                </div>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">
              {cycle.count}개 완료 태스크 기준 · 생성~완료 소요일
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <ProjectSummary
          totalTasks={totalTasks}
          doneTasks={doneTasks}
          inProgressTasks={inProgressTasks}
          overdueTasks={overdueTasks}
          completionRate={completionRate}
          unassigned={unassigned}
        />

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusDistribution data={statusCounts} />
          <PriorityDistribution data={priorityCounts} />
        </div>

        <WeeklyTrend data={weeklyData} />

        {memberWorkload.length > 0 && (
          <MemberWorkload data={memberWorkload} />
        )}

        {/* Sprint charts */}
        {(burndownData.length > 0 || velocityData.length > 0) && (
          <div className="space-y-6">
            <h2 className="text-sm font-semibold text-muted-foreground border-b pb-2">스프린트 분석</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BurndownChart data={burndownData} />
              <VelocityChart data={velocityData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
