import { Shield, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectHealthProps {
  onSchedulePercent: number;
}

export function ProjectHealth({ onSchedulePercent }: ProjectHealthProps) {
  const status = onSchedulePercent >= 80 ? "on-track" : onSchedulePercent >= 50 ? "at-risk" : "behind";
  const config = {
    "on-track": { label: "정상", icon: Shield, color: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
    "at-risk": { label: "주의", icon: AlertTriangle, color: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/25" },
    "behind": { label: "지연", icon: XCircle, color: "text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/25" },
  }[status];

  return (
    <div className={cn("flex items-center gap-3 rounded-lg border p-4", config.color)}>
      <config.icon className="h-6 w-6" />
      <div>
        <p className="font-semibold">{config.label}</p>
        <p className="text-sm opacity-80">일정 준수 {onSchedulePercent}%</p>
      </div>
    </div>
  );
}
