import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProjectProgress } from "@/components/dashboard/project-progress";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { CompletionTrend } from "@/components/dashboard/completion-trend";
import { KPIOverview } from "@/components/dashboard/kpi-overview";
import { ActiveSprints } from "@/components/dashboard/active-sprints";
import { MemberWorkload } from "@/components/dashboard/member-workload";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/session";
import { format, subDays, startOfWeek } from "date-fns";

export default async function DashboardPage() {
  const ctx = await requireOrganization();
  const orgId = ctx.organization.id;
  const orgFilter = { project: { workspace: { organizationId: orgId } } };

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  // Use count/groupBy instead of loading all records
  const [totalTasks, completedTasks, overdueTasks, activeProjects] = await Promise.all([
    db.task.count({ where: { archivedAt: null, ...orgFilter } }),
    db.task.count({ where: { archivedAt: null, status: "done", ...orgFilter } }),
    db.task.count({ where: { archivedAt: null, dueDate: { lt: todayStr }, status: { not: "done" }, ...orgFilter } }),
    db.project.count({ where: { status: "active", workspace: { organizationId: orgId } } }),
  ]);

  // Project progress - only active projects with task counts
  const projects = await db.project.findMany({
    where: { status: "active", archivedAt: null, workspace: { organizationId: orgId } },
    include: {
      _count: { select: { tasks: true } },
      tasks: { where: { archivedAt: null, status: "done" }, select: { id: true } },
    },
  });

  const projectData = projects.map((p) => ({
    id: p.id, name: p.name, color: p.color,
    totalTasks: p._count.tasks,
    completedTasks: p.tasks.length,
  }));

  // Upcoming deadlines - limited query
  const upcoming = await db.task.findMany({
    where: { dueDate: { gte: todayStr }, status: { not: "done" }, archivedAt: null, ...orgFilter },
    include: { project: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
    take: 10,
  });

  const upcomingData = upcoming.map((t) => ({
    id: t.id, title: t.title, dueDate: t.dueDate, projectName: t.project.name, projectId: t.projectId, status: t.status,
  }));

  // Activity heatmap - use groupBy for efficiency
  const activityRaw = await db.activityLog.findMany({
    where: { occurredAt: { gte: subDays(today, 365) }, organizationId: orgId },
    select: { occurredAt: true },
  });
  const activityMap: Record<string, number> = {};
  activityRaw.forEach((log) => {
    const key = format(log.occurredAt, "yyyy-MM-dd");
    activityMap[key] = (activityMap[key] ?? 0) + 1;
  });

  // OKR overview
  const objectivesRaw = await db.objective.findMany({
    where: { project: { workspace: { organizationId: orgId } } },
    include: {
      project: { select: { id: true, name: true } },
      keyResults: {
        select: { id: true, title: true, currentValue: true, targetValue: true, startValue: true, unit: true, direction: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
    take: 5,
  });
  const okrData = objectivesRaw.map((o) => ({
    id: o.id,
    title: o.title,
    projectId: o.project.id,
    projectName: o.project.name,
    keyResults: o.keyResults,
  }));

  // Active sprints
  const activeSprints = await db.sprint.findMany({
    where: { status: "active", project: { workspace: { organizationId: orgId } } },
    include: {
      project: { select: { id: true, name: true } },
      tasks: { include: { task: { select: { status: true } } } },
    },
  });
  const sprintData = activeSprints.map((s) => {
    const total = s.tasks.length;
    const done = s.tasks.filter((t) => t.task.status === "done").length;
    return { id: s.id, name: s.name, projectId: s.project.id, projectName: s.project.name, startDate: s.startDate, endDate: s.endDate, total, done };
  });

  // Weekly completion trend - single query, group in JS
  const weeklyStart = startOfWeek(subDays(today, 11 * 7));
  const completedTasks12w = await db.task.findMany({
    where: { completedAt: { gte: weeklyStart }, ...orgFilter },
    select: { completedAt: true },
  });
  const weeklyData: { week: string; completed: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const ws = startOfWeek(subDays(today, i * 7));
    const we = new Date(ws.getTime() + 7 * 24 * 60 * 60 * 1000);
    const count = completedTasks12w.filter((t) => t.completedAt && t.completedAt >= ws && t.completedAt < we).length;
    weeklyData.push({ week: format(ws, "MM/dd"), completed: count });
  }

  // Member workload - single query, group in JS
  const allMembers = await db.member.findMany({
    where: { isActive: true, workspace: { organizationId: orgId } },
    select: { id: true, name: true, color: true },
  });
  const memberTasks = await db.task.findMany({
    where: { memberId: { not: null }, archivedAt: null, ...orgFilter },
    select: { memberId: true, status: true, dueDate: true },
  });
  const memberWorkloadData = allMembers.map((m) => {
    const tasks = memberTasks.filter((t) => t.memberId === m.id);
    return {
      id: m.id, name: m.name, color: m.color,
      todo: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      inReview: tasks.filter((t) => t.status === "in_review").length,
      done: tasks.filter((t) => t.status === "done").length,
      overdue: tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== "done" && t.status !== "cancelled").length,
    };
  });

  return (
    <div>
      <Header title="대시보드" />
      <div className="p-6 space-y-8 max-w-full">
        <StatsCards totalTasks={totalTasks} completedTasks={completedTasks} overdueTasks={overdueTasks} activeProjects={activeProjects} />
        <div className="grid gap-8 md:grid-cols-2">
          <ProjectProgress projects={projectData} />
          <UpcomingDeadlines tasks={upcomingData} />
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <ActiveSprints sprints={sprintData} />
          <KPIOverview objectives={okrData} />
        </div>
        <MemberWorkload members={memberWorkloadData} />
        <div className="grid gap-8 md:grid-cols-2">
          <ActivityHeatmap data={activityMap} />
          <CompletionTrend data={weeklyData} />
        </div>
      </div>
    </div>
  );
}
