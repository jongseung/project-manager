import Link from "next/link";

interface ProjectProgressProps {
  projects: {
    id: string;
    name: string;
    color: string;
    totalTasks: number;
    completedTasks: number;
  }[];
}

export function ProjectProgress({ projects }: ProjectProgressProps) {
  if (projects.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">프로젝트 진행률</h3>
      {projects.map((project) => {
        const pct = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
        return (
          <Link key={project.id} href={`/projects/${project.id}/board`} className="block">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
              <span className="text-sm flex-1 truncate">{project.name}</span>
              <span className="text-xs text-muted-foreground w-16 text-right">{project.completedTasks}/{project.totalTasks}</span>
              <span className="text-xs font-medium w-10 text-right">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1 ml-5">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: project.color }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
