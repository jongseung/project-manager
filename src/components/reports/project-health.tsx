import { Shield, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectHealthProps {
  onSchedulePercent: number;
}

export function ProjectHealth({ onSchedulePercent }: ProjectHealthProps) {
  const status = onSchedulePercent >= 80 ? "on-track" : onSchedulePercent >= 50 ? "at-risk" : "behind";
  const config = {
    "on-track": { label: "On Track", icon: Shield, color: "text-green-600 bg-green-50 border-green-200" },
    "at-risk": { label: "At Risk", icon: AlertTriangle, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
    "behind": { label: "Behind", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
  }[status];

  return (
    <div className={cn("flex items-center gap-3 rounded-lg border p-4", config.color)}>
      <config.icon className="h-6 w-6" />
      <div>
        <p className="font-semibold">{config.label}</p>
        <p className="text-sm opacity-80">{onSchedulePercent}% of tasks on schedule</p>
      </div>
    </div>
  );
}
