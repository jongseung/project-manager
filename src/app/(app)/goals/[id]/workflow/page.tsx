import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Circle, Target, Briefcase, ListTodo, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function GoalWorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const goal = await db.goal.findUnique({
    where: { id },
    include: {
      kpis: true,
      projectLinks: {
        include: {
          project: {
            include: {
              tasks: { where: { archivedAt: null, parentTaskId: null }, select: { id: true, title: true, status: true }, take: 20 },
            },
          },
        },
      },
    },
  });

  if (!goal) notFound();

  const allTasks = goal.projectLinks.flatMap((l) => l.project.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "done").length;
  const goalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div>
      <Header title={`${goal.title} — 워크플로우`}>
        <Link href={`/goals/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />목표 상세</Button>
        </Link>
      </Header>
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Goal Column */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4" /> 목표</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{goal.title}</CardTitle>
                {goal.description && <CardDescription>{goal.description}</CardDescription>}
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${goalProgress}%` }} />
                  </div>
                  <span className="text-xs font-medium">{goalProgress}%</span>
                </div>
                {goal.kpis.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {goal.kpis.map((kpi) => (
                      <div key={kpi.id} className="flex items-center justify-between text-xs">
                        <span>{kpi.name}</span>
                        <span className="font-medium">{kpi.currentValue}/{kpi.targetValue}{kpi.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardHeader>
            </Card>
          </div>

          {/* Projects Column */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4" /> 계획 (프로젝트)</h2>
            {goal.projectLinks.map(({ project }) => {
              const pTotal = project.tasks.length;
              const pDone = project.tasks.filter((t) => t.status === "done").length;
              const pPct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
              return (
                <Card key={project.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{project.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pPct}%` }} />
                      </div>
                      <span className="text-xs">{pDone}/{pTotal}</span>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
            {goal.projectLinks.length === 0 && <p className="text-sm text-muted-foreground">No projects linked.</p>}
          </div>

          {/* Tasks Column */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><ListTodo className="h-4 w-4" /> 실행 (태스크)</h2>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {allTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent/50">
                  {task.status === "done" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={cn("truncate", task.status === "done" && "line-through text-muted-foreground")}>
                    {task.title}
                  </span>
                </div>
              ))}
              {allTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
