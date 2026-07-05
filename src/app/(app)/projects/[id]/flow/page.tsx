import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, AlertTriangle, Ban, Clock, UserX, TrendingUp, TrendingDown } from "lucide-react";
import { getProject } from "@/actions/project";
import { getProjectFlow, type FlowSignalTask } from "@/actions/flow";
import { ProjectHeader } from "@/components/project/project-header";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STAGE_COLOR: Record<string, string> = {
  backlog: "bg-slate-400",
  todo: "bg-slate-500",
  in_progress: "bg-amber-400",
  in_review: "bg-violet-400",
  done: "bg-emerald-500",
};

function SignalCard({
  icon: Icon, tone, title, count, tasks, projectId,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "red" | "amber" | "violet" | "muted";
  title: string;
  count: number;
  tasks?: FlowSignalTask[];
  projectId: string;
}) {
  const toneCls = {
    red: "text-red-500",
    amber: "text-amber-500",
    violet: "text-violet-500",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", toneCls)} />
        <span className="text-sm font-medium">{title}</span>
        <span className={cn("ml-auto text-2xl font-semibold tabular-nums", count > 0 ? toneCls : "text-muted-foreground/50")}>{count}</span>
      </div>
      {tasks && tasks.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-border pt-2">
          {tasks.map((t) => (
            <li key={t.id}>
              <Link
                href={`/projects/${projectId}/board?task=${t.id}`}
                className="-mx-1.5 flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs transition-colors hover:bg-accent"
              >
                <span className="truncate text-foreground/80">{t.title}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{t.reason}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {tasks && tasks.length === 0 && count === 0 && (
        <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground/60">없음 — 양호합니다</p>
      )}
    </div>
  );
}

export default async function ProjectFlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, flow] = await Promise.all([getProject(id), getProjectFlow(id)]);
  if (!project || !flow) notFound();

  const maxStage = Math.max(1, ...flow.stages.map((s) => s.count));
  const { throughput } = flow;
  const netUp = throughput.net >= 0;

  return (
    <div>
      <ProjectHeader
        projectId={project.id}
        projectName={project.name}
        workspaceName={project.workspace.name}
        projectColor={project.color}
        taskCount={project.tasks.length}
        epicCount={project.epics.length}
        storyCount={project.stories.length}
      />
      <div className="max-w-full space-y-6 p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">프로젝트 흐름</h2>
            <p className="text-xs text-muted-foreground">지금 일이 어디까지 와 있고 어디서 막혀 있는지 한눈에 보세요.</p>
          </div>
        </div>

        {/* Pipeline */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-stretch gap-2">
            {flow.stages.map((s, i) => {
              const isBottleneck = flow.bottleneck === s.status;
              return (
                <div key={s.status} className="flex flex-1 items-center gap-2">
                  <div className={cn(
                    "flex-1 rounded-lg border p-3 transition-colors",
                    isBottleneck ? "border-amber-400/60 bg-amber-400/5" : "border-border"
                  )}>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", STAGE_COLOR[s.status])} />
                      <span className="text-xs font-medium text-muted-foreground">{TASK_STATUS_LABELS[s.status as TaskStatus]}</span>
                      {isBottleneck && (
                        <span className="ml-auto rounded bg-amber-400/15 px-1.5 py-px text-[10px] font-semibold text-amber-600 dark:text-amber-400">병목</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold tabular-nums">{s.count}</span>
                      {s.wipLimit !== undefined && (
                        <span className={cn("text-xs", s.over ? "font-medium text-red-500" : "text-muted-foreground/60")}>/ WIP {s.wipLimit}</span>
                      )}
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full", STAGE_COLOR[s.status])} style={{ width: `${(s.count / maxStage) * 100}%` }} />
                    </div>
                  </div>
                  {i < flow.stages.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30" />}
                </div>
              );
            })}
          </div>

          {/* Throughput strip */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3 text-sm">
            <span className="flex items-center gap-1.5">
              {netUp ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
              <span className="text-muted-foreground">이번 주 순흐름</span>
              <span className={cn("font-semibold tabular-nums", netUp ? "text-emerald-500" : "text-red-500")}>
                {netUp ? "+" : ""}{throughput.net}
              </span>
            </span>
            <span className="text-muted-foreground">완료 <span className="font-medium text-foreground tabular-nums">{throughput.thisWeekDone}</span></span>
            <span className="text-muted-foreground">신규 <span className="font-medium text-foreground tabular-nums">{throughput.thisWeekCreated}</span></span>
            <span className="text-muted-foreground/70 text-xs">지난주 완료 {throughput.lastWeekDone}건</span>
          </div>
        </div>

        {/* Signals */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SignalCard icon={AlertTriangle} tone="red" title="지연" count={flow.signals.overdue.length} tasks={flow.signals.overdue} projectId={id} />
          <SignalCard icon={Ban} tone="amber" title="막힘 (선행 미완)" count={flow.signals.blocked.length} tasks={flow.signals.blocked} projectId={id} />
          <SignalCard icon={Clock} tone="violet" title="정체 (7일+)" count={flow.signals.stale.length} tasks={flow.signals.stale} projectId={id} />
          <SignalCard icon={UserX} tone="muted" title="미할당" count={flow.signals.unassigned} projectId={id} />
        </div>

        {/* Epic swimlanes */}
        {flow.epics.length > 0 && (
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">에픽별 진행 흐름</h3>
            </div>
            <div className="divide-y divide-border">
              {flow.epics.map((e) => (
                <Link key={e.id} href={`/projects/${id}/board?epic=${e.id}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/60">
                  <div className="w-48 shrink-0">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.done}/{e.total} 완료 · {e.progress}%</p>
                  </div>
                  {/* segmented flow bar */}
                  <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    {e.total > 0 && (
                      <>
                        <div className="h-full bg-emerald-500" style={{ width: `${(e.done / e.total) * 100}%` }} title={`완료 ${e.done}`} />
                        <div className="h-full bg-violet-400" style={{ width: `${(e.review / e.total) * 100}%` }} title={`검토 ${e.review}`} />
                        <div className="h-full bg-amber-400" style={{ width: `${(e.inProgress / e.total) * 100}%` }} title={`진행 ${e.inProgress}`} />
                        <div className="h-full bg-slate-400" style={{ width: `${(e.todo / e.total) * 100}%` }} title={`대기 ${e.todo}`} />
                      </>
                    )}
                  </div>
                  {e.atRisk > 0 ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                      <AlertTriangle className="h-3 w-3" />{e.atRisk}
                    </span>
                  ) : (
                    <span className="w-8 shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          더 자세한 지표(사이클타임·번다운·속도)는{" "}
          <Link href={`/projects/${id}/reports`} className="text-primary hover:underline">리포트</Link>에서 확인하세요.
        </p>
      </div>
    </div>
  );
}
