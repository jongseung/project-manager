import Link from "next/link";
import { Calendar } from "lucide-react";
import { formatDate, isOverdue, cn } from "@/lib/utils";

interface UpcomingDeadlinesProps {
  tasks: { id: string; title: string; dueDate: string | null; projectName: string; projectId: string; status: string }[];
}

export function UpcomingDeadlines({ tasks }: UpcomingDeadlinesProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">다가오는 마감일</h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <Link key={task.id} href={`/projects/${task.projectId}/board`} className="flex items-center gap-3 text-sm hover:bg-accent/50 rounded-md px-1 py-0.5 -mx-1 transition-colors">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate">{task.title}</span>
            <span className="text-xs text-muted-foreground">{task.projectName}</span>
            <span className={cn("text-xs", isOverdue(task.dueDate) ? "text-red-500 font-medium" : "text-muted-foreground")}>
              {formatDate(task.dueDate)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
