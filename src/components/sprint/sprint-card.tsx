import { Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface SprintCardProps {
  sprint: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    tasks: { task: { id: string; status: string } }[];
  };
}

const STATUS_BADGE: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export function SprintCard({ sprint }: SprintCardProps) {
  const total = sprint.tasks.length;
  const completed = sprint.tasks.filter((t) => t.task.status === "done").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{sprint.name}</CardTitle>
          <Badge className={STATUS_BADGE[sprint.status] ?? ""} variant="secondary">
            {sprint.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {completed}/{total} tasks
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </CardHeader>
    </Card>
  );
}
