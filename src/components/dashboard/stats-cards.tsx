import { CheckCircle2, Clock, AlertTriangle, FolderKanban } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface StatsCardsProps {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeProjects: number;
}

export function StatsCards({ totalTasks, completedTasks, overdueTasks, activeProjects }: StatsCardsProps) {
  const stats = [
    { label: "전체 태스크", value: totalTasks, icon: Clock, color: "text-muted-foreground" },
    { label: "완료", value: completedTasks, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "지연", value: overdueTasks, icon: AlertTriangle, color: "text-red-500" },
    { label: "진행 중 프로젝트", value: activeProjects, icon: FolderKanban, color: "text-muted-foreground" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs">{stat.label}</CardDescription>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <CardTitle className="text-2xl">{stat.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
