import { Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { SPRINT_STATUS_TONE } from "@/lib/status-styles";

const SPRINT_LABEL: Record<string, string> = { planning: "계획", active: "진행 중", completed: "완료" };

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

export function SprintCard({ sprint }: SprintCardProps) {
  const total = sprint.tasks.length;
  const completed = sprint.tasks.filter((t) => t.task.status === "done").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{sprint.name}</CardTitle>
          <Badge className={SPRINT_STATUS_TONE[sprint.status] ?? ""} variant="secondary">
            {SPRINT_LABEL[sprint.status] ?? sprint.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {completed}/{total} 태스크
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </CardHeader>
    </Card>
  );
}
