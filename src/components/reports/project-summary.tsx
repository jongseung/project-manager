import { CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp, UserX } from "lucide-react";

interface ProjectSummaryProps {
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  unassigned: number;
}

export function ProjectSummary({ totalTasks, doneTasks, inProgressTasks, overdueTasks, completionRate, unassigned }: ProjectSummaryProps) {
  const cards = [
    { label: "전체 태스크", value: totalTasks, icon: ListTodo, color: "text-foreground" },
    { label: "완료", value: doneTasks, icon: CheckCircle2, color: "text-green-600" },
    { label: "진행 중", value: inProgressTasks, icon: Clock, color: "text-blue-600" },
    { label: "지연", value: overdueTasks, icon: AlertTriangle, color: overdueTasks > 0 ? "text-red-600" : "text-muted-foreground" },
    { label: "완료율", value: `${completionRate}%`, icon: TrendingUp, color: completionRate >= 70 ? "text-green-600" : completionRate >= 40 ? "text-yellow-600" : "text-muted-foreground" },
    { label: "미배정", value: unassigned, icon: UserX, color: unassigned > 0 ? "text-yellow-600" : "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border bg-card p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
            <span className="text-[11px] text-muted-foreground">{c.label}</span>
          </div>
          <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
