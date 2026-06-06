import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getCurrentOrgId } from "@/lib/session";
import { GoalDetailActions } from "./goal-detail-actions";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orgId = await getCurrentOrgId();
  if (!orgId) notFound();

  const goal = await db.goal.findFirst({
    where: { id, workspace: { organizationId: orgId } },
    include: {
      kpis: { include: { entries: { orderBy: { recordedAt: "asc" } } } },
      projectLinks: {
        include: {
          project: {
            include: {
              objectives: {
                include: { keyResults: { orderBy: { sortOrder: "asc" } } },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
      workspace: { include: { projects: { select: { id: true, name: true }, orderBy: { name: "asc" } } } },
    },
  });

  if (!goal) notFound();

  // Surface project-level OKRs linked to this goal so 목표 becomes the single
  // place to see measurement (목표 ↔ OKR 일원화).
  const krProgress = (kr: { startValue: number; currentValue: number; targetValue: number; direction: string }) => {
    // "maintain": closer to target = better; measured as inverse deviation.
    if (kr.direction === "maintain") {
      if (kr.targetValue === 0) return kr.currentValue === 0 ? 100 : 0;
      const deviation = Math.abs(kr.currentValue - kr.targetValue) / Math.abs(kr.targetValue);
      return Math.max(0, Math.min(100, Math.round((1 - deviation) * 100)));
    }
    const span = kr.direction === "decrease" ? kr.startValue - kr.targetValue : kr.targetValue - kr.startValue;
    const done = kr.direction === "decrease" ? kr.startValue - kr.currentValue : kr.currentValue - kr.startValue;
    if (span === 0) return 0;
    return Math.max(0, Math.min(100, Math.round((done / span) * 100)));
  };
  const okrProjects = goal.projectLinks
    .map((l) => l.project)
    .filter((p) => p.objectives.length > 0);

  const linkedProjectIds = goal.projectLinks.map((l) => l.projectId);
  // Guard: workspace is nullable in schema (onDelete: SetNull). Treat as empty project list if orphaned.
  const availableProjects = (goal.workspace?.projects ?? []).filter((p) => !linkedProjectIds.includes(p.id));

  return (
    <div>
      <Header title={goal.title}>
        <Link href="/goals">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />목표</Button>
        </Link>
        <Link href={`/goals/${goal.id}/workflow`}>
          <Button variant="outline" size="sm">워크플로우</Button>
        </Link>
        <Badge variant="secondary">{goal.status.replace("_", " ")}</Badge>
      </Header>
      <div className="p-6 space-y-8 max-w-full">
        {goal.description && (
          <p className="text-muted-foreground">{goal.description}</p>
        )}

        <GoalDetailActions
          goalId={goal.id}
          linkedProjects={goal.projectLinks.map((l) => l.project)}
          availableProjects={availableProjects}
          kpis={goal.kpis}
        />

        {/* 연결된 프로젝트 OKR — 목표에서 측정 지표를 한곳에서 본다 */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">연결된 프로젝트 OKR</h2>
          </div>
          {okrProjects.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              연결된 프로젝트에 등록된 OKR이 없습니다. 프로젝트의 OKR 탭에서 목표·핵심결과를 추가하면 여기에 함께 표시됩니다.
            </p>
          ) : (
            <div className="space-y-4">
              {okrProjects.map((project) => (
                <div key={project.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                      {project.name}
                    </span>
                    <Link
                      href={`/projects/${project.id}/okr`}
                      className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      OKR 열기 <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {project.objectives.map((obj) => (
                      <div key={obj.id}>
                        <p className="mb-1.5 text-sm font-medium">{obj.title}</p>
                        <div className="space-y-2 border-l-2 border-border pl-3">
                          {obj.keyResults.length === 0 ? (
                            <p className="text-xs text-muted-foreground/70">핵심 결과 없음</p>
                          ) : (
                            obj.keyResults.map((kr) => {
                              const pct = krProgress(kr);
                              return (
                                <div key={kr.id}>
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="truncate text-foreground/85">{kr.title}</span>
                                    <span className="shrink-0 tabular-nums text-muted-foreground">
                                      {kr.currentValue}/{kr.targetValue}{kr.unit} · {pct}%
                                    </span>
                                  </div>
                                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
