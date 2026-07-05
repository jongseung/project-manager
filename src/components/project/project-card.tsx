import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import type { Project } from "@prisma/client";

export interface ProjectStats {
  total: number;
  done: number;
  inReview: number;
  inProgress: number;
  todo: number;
  overdue: number;
}

interface ProjectCardProps {
  project: Project;
  stats?: ProjectStats;
}

export function ProjectCard({ project, stats }: ProjectCardProps) {
  const pct = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <Link href={`/projects/${project.id}/flow`}>
      <Card className="cursor-pointer transition-colors hover:border-foreground/20">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
              <CardTitle className="truncate text-base">{project.name}</CardTitle>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
            </Badge>
          </div>

          {project.description && (
            <CardDescription className="mt-1 line-clamp-1">{project.description}</CardDescription>
          )}

          {/* At-a-glance progress + status distribution */}
          {stats && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {stats.total > 0 ? `${stats.done}/${stats.total} 완료` : "태스크 없음"}
                </span>
                <span className="flex items-center gap-2 tabular-nums">
                  {stats.overdue > 0 && <span className="font-medium text-red-500">지연 {stats.overdue}</span>}
                  <span className="font-semibold">{pct}%</span>
                </span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                {stats.total > 0 && (
                  <>
                    <div className="h-full bg-emerald-500" style={{ width: `${(stats.done / stats.total) * 100}%` }} />
                    <div className="h-full bg-violet-400" style={{ width: `${(stats.inReview / stats.total) * 100}%` }} />
                    <div className="h-full bg-amber-400" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }} />
                    <div className="h-full bg-slate-400" style={{ width: `${(stats.todo / stats.total) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}
